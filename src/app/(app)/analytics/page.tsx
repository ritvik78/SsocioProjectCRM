import { Suspense } from "react";
import { AnalyticsServer } from "@/components/analytics/analytics-server";
import { DashboardSkeleton } from "@/components/ui/skeletons";

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <AnalyticsServer />
    </Suspense>
  );
}