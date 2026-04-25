import { createFileRoute, redirect } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useState } from "react";

import AdminAnalyticsPage from "@/app/admin-analytics/page";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { getPathWithoutLocale } from "intlayer";

export const Route = createFileRoute("/{-$locale}/admin/analytics")({
  beforeLoad: ({ context, location, params }) => {
    if (!context.isAuthenticated) {
      throw redirect({
        to: "/{-$locale}/sign-in",
        params: { locale: params.locale ?? "" },
        search: {
          redirectTo: getPathWithoutLocale(location.href),
        },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <>
      <Authenticated>
        <AdminAnalyticsPage />
      </Authenticated>
      <Unauthenticated>
        {showSignIn ? (
          <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
        ) : (
          <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
        )}
      </Unauthenticated>
      <AuthLoading>
        <div className="flex min-h-svh items-center justify-center">Loading...</div>
      </AuthLoading>
    </>
  );
}
