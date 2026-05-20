import { Button } from "@convex-zen/ui/components/button";
import { LocalizedLink } from "@/components/localized-link";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import type { LocalizedTo } from "@/hooks/useLocalizedNavigate";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import AuthLayout from "@/components/auth-layout";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/{-$locale}/verify-email")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { token?: string; email?: string; redirectTo?: string } => ({
    token: typeof search.token === "string" ? search.token : undefined,
    email: typeof search.email === "string" ? search.email : undefined,
    redirectTo: typeof search.redirectTo === "string" ? search.redirectTo : undefined,
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useLocalizedNavigate();
  const { token, email, redirectTo } = Route.useSearch();
  const session = authClient.useSession();
  const safeRedirectTo = redirectTo ?? "/onboarding/organization";
  const [status, setStatus] = useState<"idle" | "verifying" | "verified" | "failed">(
    token ? "verifying" : "idle",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    void authClient.verifyEmail(
      {
        query: {
          token,
          callbackURL: safeRedirectTo,
        },
      },
      {
        onSuccess: () => {
          if (cancelled) {
            return;
          }
          setStatus("verified");
          toast.success("Email verified");
          navigate({ to: safeRedirectTo as LocalizedTo });
        },
        onError: (error) => {
          if (cancelled) {
            return;
          }
          setStatus("failed");
          toast.error(error.error.message || error.error.statusText);
        },
      },
    );

    return () => {
      cancelled = true;
    };
  }, [navigate, safeRedirectTo, token]);

  const resendEmail = session.data?.user?.email ?? email;

  return (
    <AuthLayout
      title="Verify email"
      description="Finish setup by confirming the email address on your account."
    >
      <div className="space-y-4 text-sm text-muted-foreground">
        {status === "verifying" ? <p>Verifying your email...</p> : null}
        {status === "failed" ? (
          <p>This verification link failed. You can request another email below.</p>
        ) : null}
        {status === "idle" ? (
          <p>
            We sent a verification link to{" "}
            <span className="text-foreground">{resendEmail ?? "your email"}</span>.
          </p>
        ) : null}
        {status === "verified" ? <p>Email verified. Redirecting...</p> : null}

        {resendEmail ? (
          <Button
            variant="outline"
            onClick={() => {
              authClient.sendVerificationEmail(
                {
                  email: resendEmail,
                  callbackURL: safeRedirectTo,
                },
                {
                  onSuccess: () => {
                    toast.success("Verification email sent");
                  },
                  onError: (error) => {
                    toast.error(error.error.message || error.error.statusText);
                  },
                },
              );
            }}
          >
            Resend verification email
          </Button>
        ) : (
          <LocalizedLink to="/sign-in" className="text-primary underline-offset-4 hover:underline">
            Sign in to resend verification
          </LocalizedLink>
        )}
      </div>
    </AuthLayout>
  );
}
