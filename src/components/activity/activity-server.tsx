import * as React from "react";
import dynamic from "next/dynamic";
import { requirePermission } from "@/lib/auth";
import { TableSkeleton } from "@/components/ui/skeletons";

const ActivityView = dynamic(
  () => import("./activity-view").then((mod) => mod.ActivityView),
  {
    loading: () => <TableSkeleton />,
  }
);

export async function ActivityServer() {
  await requirePermission("activity.view");
  return <ActivityView />;
}
