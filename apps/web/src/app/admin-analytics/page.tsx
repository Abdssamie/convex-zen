import { useMemo } from "react";
import { api } from "@convex-zen/backend/convex/_generated/api";
import { AnalyticsDashboard } from "@abdssamie/convex-analytics/react";
import { useQuery } from "convex/react";

import { BaseLayout } from "@/components/layouts/base-layout";

export default function AdminAnalyticsPage() {
  const site = useQuery(api.analytics.getSiteBySlug, { slug: "default" });

  const analyticsApi = useMemo(
    () => ({
      getDashboardSummary: api.analytics.getDashboardSummary,
      getOverview: api.analytics.getOverview,
      getTimeseries: api.analytics.getTimeseries,
      getTopPages: api.analytics.getTopPages,
      getTopReferrers: api.analytics.getTopReferrers,
      getTopSources: api.analytics.getTopSources,
      getTopMediums: api.analytics.getTopMediums,
      getTopCampaigns: api.analytics.getTopCampaigns,
      getTopEvents: api.analytics.getTopEvents,
      getTopDevices: api.analytics.getTopDevices,
      getTopBrowsers: api.analytics.getTopBrowsers,
      getTopOs: api.analytics.getTopOs,
      getTopCountries: api.analytics.getTopCountries,
      listRawEvents: api.analytics.listRawEvents,
      listPageviews: api.analytics.listPageviews,
      listSessions: api.analytics.listSessions,
      listVisitors: api.analytics.listVisitors,
    }),
    [],
  );

  return (
    <BaseLayout
      title="Analytics"
      description="Protected analytics dashboard backed by Convex Analytics."
    >
      <div className="px-4 lg:px-6">
        {site === undefined ? (
          <div>Loading analytics...</div>
        ) : site === null ? (
          <div>Default analytics site not found.</div>
        ) : (
          <AnalyticsDashboard siteId={site._id} api={analyticsApi} />
        )}
      </div>
    </BaseLayout>
  );
}
