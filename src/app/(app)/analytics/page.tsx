import { requirePermission } from "@/lib/auth";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export default async function AnalyticsPage() {
  await requirePermission("analytics.view");
  return <AnalyticsView />;
}