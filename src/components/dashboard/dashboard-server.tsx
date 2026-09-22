import * as React from "react";
import dynamic from "next/dynamic";
import { requireUser, hasPermission } from "@/lib/auth";
import { DashboardSkeleton } from "@/components/ui/skeletons";

const DashboardView = dynamic(
  () => import("./dashboard-view").then((mod) => mod.DashboardView),
  {
    loading: () => <DashboardSkeleton />,
  }
);

export async function DashboardServer() {
  const ctx = await requireUser();
  const canAnalytics = hasPermission(ctx.user, "analytics.view");
  return <DashboardView user={ctx.user} canAnalytics={canAnalytics} />;
}
