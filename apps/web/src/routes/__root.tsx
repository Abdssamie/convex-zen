import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { Toaster } from "@convex-zen/ui/components/sonner";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouteContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";

import { createAnalytics } from "@abdssamie/convex-analytics";
import { authClient } from "@/lib/auth-client";
import { getToken } from "@/lib/auth-server";
import { ThemeProvider } from "@/components/theme-provider";
import { HeadProvider } from "@/lib/head-provider";
import { defaultLocale, getHTMLTextDir } from "intlayer";
import { IntlayerProvider } from "react-intlayer";
import { Route as LocaleRoute } from "./{-$locale}/route";

import appCss from "../index.css?url";
import { env } from "@convex-zen/env/web";

const getAuth = createServerFn({ method: "GET" }).handler(async () => {
  return await getToken();
});

function getAnalytics() {
  return createAnalytics({
    endpoint: `${env.VITE_CONVEX_SITE_URL}/analytics/ingest`,
    writeKey: env.VITE_ANALYTICS_WRITE_KEY,
    autoPageviews: false,
  });
}

export interface RouterAppContext {
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "ConvexZen",
      },
      {
        property: "og:title",
        content: "ConvexZen",
      },
      {
        property: "og:image",
        content: "/og-image.png",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:image",
        content: "/og-image.png",
      },
      {
        property: "og:type",
        content: "website",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: () => {
    const context = useRouteContext({ from: Route.id });

    getAnalytics().page();

    return (
      <QueryClientProvider client={context.queryClient}>
        <ConvexBetterAuthProvider
          client={context.convexQueryClient.convexClient}
          authClient={authClient}
          initialToken={context.token}
        >
          <ThemeProvider>
            <HeadProvider>
              <RootDocument>
                <Outlet />
              </RootDocument>
            </HeadProvider>
          </ThemeProvider>
        </ConvexBetterAuthProvider>
      </QueryClientProvider>
    );
  },
  beforeLoad: async (ctx) => {
    const token = await getAuth();
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }
    return {
      isAuthenticated: !!token,
      token,
    };
  },
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const params = LocaleRoute.useParams();
  const locale = params?.locale ?? defaultLocale;

  return (
    <html dir={getHTMLTextDir(locale)} lang={locale} suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          defer
          data-endpoint={`${env.VITE_CONVEX_SITE_URL}/analytics/ingest`}
          src="https://unpkg.com/@abdssamie/convex-analytics@0.1.6/dist/embed/convex-analytics.js"
          data-write-key={env.VITE_ANALYTICS_WRITE_KEY}
          data-auto-pageviews="true"
        ></script>
      </head>
      <body>
        <IntlayerProvider locale={locale}>
          {children}
          <Toaster richColors />
          <TanStackRouterDevtools position="bottom-left" />
          <Scripts />
        </IntlayerProvider>
      </body>
    </html>
  );
}
