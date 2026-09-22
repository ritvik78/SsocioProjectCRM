import { Suspense } from "react";
import { DashboardServer } from "@/components/dashboard/dashboard-server";
import { DashboardSkeleton } from "@/components/ui/skeletons";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardServer />
    </Suspense>
  );
}