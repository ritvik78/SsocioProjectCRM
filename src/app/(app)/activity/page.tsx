import { Suspense } from "react";
import { ActivityServer } from "@/components/activity/activity-server";
import { TableSkeleton } from "@/components/ui/skeletons";

export default function ActivityPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ActivityServer />
    </Suspense>
  );
}