import { exposeAdminApi, exposeAnalyticsApi, provisionSite } from "@abdssamie/convex-analytics";

import { components } from "./_generated/api";

const requireAuth = async (ctx: {
  auth: {
    getUserIdentity: () => Promise<unknown>;
  };
}) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
};

export const { getSiteBySlug } = exposeAdminApi(components.convexAnalytics, {
  auth: async (ctx) => {
    await requireAuth(ctx);
  },
});

export const {
  getDashboardSummary,
  getOverview,
  getTimeseries,
  getEventPropertyBreakdown,
  getTopPages,
  getTopReferrers,
  getTopSources,
  getTopMediums,
  getTopCampaigns,
  getTopEvents,
  getTopDevices,
  getTopBrowsers,
  getTopOs,
  getTopCountries,
  listRawEvents,
  listPageviews,
  listSessions,
  listVisitors,
} = exposeAnalyticsApi(components.convexAnalytics, {
  auth: async (ctx) => {
    await requireAuth(ctx);
    // Add your own site ownership check here for operation.siteId.
  },
});

export const provisionDefaultSite = provisionSite(components.convexAnalytics, {
  auth: async () => {},
  site: {
    slug: "default",
    name: "Default site",
    writeKey: process.env.ANALYTICS_WRITE_KEY!,
    allowedOrigins: [],
  },
});
