import { Badge } from "@convex-zen/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@convex-zen/ui/components/card";
import { Button } from "@convex-zen/ui/components/button";
import { LocalizedLink } from "@/components/localized-link";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { BaseLayout } from "@/components/layouts/base-layout";

export const Route = createFileRoute("/{-$locale}/settings/account")({
  beforeLoad: ({ context, location }) => {
    if (!context.isAuthenticated) {
      throw redirect({
        to: "/{-$locale}/sign-in",
        params: { locale: location.pathname.split("/")[1] || "en" },
        search: {
          redirectTo: location.href,
        },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const session = authClient.useSession();
  const user = session.data?.user;

  return (
    <BaseLayout title="Account" description="Review your Better Auth profile and security status.">
      <div className="grid gap-6 px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your current account details from Better Auth.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user?.name ?? "Unknown user"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email ?? "No email"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Verification</p>
              <div>
                <Badge variant={user?.emailVerified ? "default" : "secondary"}>
                  {user?.emailVerified ? "Verified" : "Pending verification"}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="font-mono text-sm">{user?.id ?? "Loading..."}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Common account actions for verification and password management.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {!user?.emailVerified ? (
              <Button asChild>
                <LocalizedLink
                  to="/verify-email"
                  search={{ email: user?.email ?? undefined, redirectTo: "/dashboard" }}
                >
                  Verify email
                </LocalizedLink>
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <LocalizedLink to="/forgot-password">Reset password</LocalizedLink>
            </Button>
            <Button variant="outline" asChild>
              <LocalizedLink to="/settings/billing">Open billing</LocalizedLink>
            </Button>
          </CardContent>
        </Card>
      </div>
    </BaseLayout>
  );
}
