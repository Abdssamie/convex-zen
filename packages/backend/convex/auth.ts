import { type AuthFunctions, createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth, type User, APIError } from "better-auth";
import { magicLink, organization } from "better-auth/plugins";

import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { type ActionCtx } from "./_generated/server";
import authConfig from "./auth.config";
import authSchema from "./features/auth/schema";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendMagicLinkEmail,
  sendInvitationEmail,
  sendWelcomeEmail,
} from "./features/email/betterAuth";
import { rateLimiter } from "./lib/rateLimiter";

const authFunctions: AuthFunctions = internal.auth;

function normalizeUrl(url: string) {
  return url.replace(/\/$/, "");
}

function getTrustedOrigins() {
  const configuredOrigins = [
    process.env.SITE_URL,
    process.env.AUTH_TRUSTED_ORIGINS,
    process.env.BETTER_AUTH_TRUSTED_ORIGINS,
  ]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(","))
    .map((value) => normalizeUrl(value.trim()))
    .filter(Boolean);

  return [...new Set(configuredOrigins)];
}

const trustedOrigins = getTrustedOrigins();
const siteUrl = trustedOrigins[0] ?? "";

export const authComponent = createClient<DataModel, typeof authSchema>(components.betterAuth, {
  local: {
    schema: authSchema,
  },
  authFunctions,
  triggers: {
    user: {
      onCreate: async (ctx, authUser) => {
        await ctx.db.insert("users", {
          authId: authUser._id,
          name: authUser.name,
          email: authUser.email,
          createdAt: authUser.createdAt,
          updatedAt: authUser.updatedAt,
        });
      },
      onUpdate: async (ctx, authUser) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_authId", (q) => q.eq("authId", authUser._id))
          .unique();
        if (!user) {
          return;
        }
        await ctx.db.patch("users", user._id, {
          email: authUser.email,
          name: authUser.name,
          updatedAt: authUser.updatedAt,
        });
      },
      onDelete: async (ctx, authUser) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_authId", (q) => q.eq("authId", authUser._id))
          .unique();
        if (!user) {
          return;
        }
        await ctx.db.delete("users", user._id);
      },
    },
  },
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();
export const { getAuthUser: getCurrentUser } = authComponent.clientApi();

function normalizeOrganizationInput<T extends { name?: string; slug?: string; logo?: string }>(
  organization: T,
) {
  return {
    ...organization,
    name: organization.name?.trim(),
    slug: organization.slug?.trim().toLowerCase(),
    logo: organization.logo?.trim() || undefined,
  };
}

function getBetterAuthConfig(ctx: GenericCtx<DataModel>) {
  return {
    baseURL: siteUrl,
    trustedOrigins,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }: { user: User; url: string }) => {
        const { ok, retryAfter } = await rateLimiter.limit(ctx as ActionCtx, "passwordReset", {
          key: user.email,
        });

        if (!ok) {
          throw new APIError("TOO_MANY_REQUESTS", {
            message: `Rate limit exceeded. Try again in ${Math.ceil(retryAfter / 1000)} seconds.`,
          });
        }

        await sendPasswordResetEmail({
          email: user.email,
          name: user.name,
          url,
        });
      },
    },
    emailVerification: {
      expiresIn: 7200,
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }: { user: User; url: string }) => {
        await sendVerificationEmail({
          email: user.email,
          name: user.name,
          url,
        });
      },
      afterEmailVerification: async (user: User) => {
        await sendWelcomeEmail({
          email: user.email,
          name: user.name,
        });
      },
    },
    plugins: [
      convex({
        authConfig,
        jwksRotateOnTokenGenerationError: true,
      }),
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLinkEmail({ email, url });
        },
      }),
      organization({
        allowUserToCreateOrganization: true,
        cancelPendingInvitationsOnReInvite: true,
        requireEmailVerificationOnInvitation: true,
        organizationHooks: {
          beforeCreateOrganization: async ({ organization }) => {
            return { data: normalizeOrganizationInput(organization) };
          },
          beforeUpdateOrganization: async ({ organization }) => {
            return { data: normalizeOrganizationInput(organization) };
          },
          beforeCreateInvitation: async ({ invitation }) => {
            return {
              data: {
                ...invitation,
                email: invitation.email.trim().toLowerCase(),
              },
            };
          },
        },
        async sendInvitationEmail(data) {
          const inviteLink = `${siteUrl}/invite/${data.id}`;

          await sendInvitationEmail({
            email: data.email,
            invitedByName: data.inviter?.user?.name ?? null,
            organizationName: data.organization?.name ?? null,
            inviteLink,
          });
        },
      }),
    ],
  };
}

function createAuth(ctx: GenericCtx<DataModel>) {
  return betterAuth(getBetterAuthConfig(ctx));
}

export { createAuth, getBetterAuthConfig };
