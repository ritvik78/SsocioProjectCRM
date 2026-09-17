import { requireUser, hasPermission } from "@/lib/auth";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default async function DashboardPage() {
  const ctx = await requireUser();
  const canAnalytics = hasPermission(ctx.user, "analytics.view");
  return <DashboardView user={ctx.user} canAnalytics={canAnalytics} />;
}