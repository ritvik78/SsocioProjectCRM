import * as React from "react";
import dynamic from "next/dynamic";
import { requirePermission } from "@/lib/auth";
import { DashboardSkeleton } from "@/components/ui/skeletons";

const AnalyticsView = dynamic(
  () => import("./analytics-view").then((mod) => mod.AnalyticsView),
  {
    loading: () => <DashboardSkeleton />,
  }
);

export async function AnalyticsServer() {
  await requirePermission("analytics.view");
  return <AnalyticsView />;
}
