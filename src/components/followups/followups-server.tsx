import * as React from "react";
import dynamic from "next/dynamic";
import { requirePermission } from "@/lib/auth";
import { TableSkeleton } from "@/components/ui/skeletons";

const FollowupsView = dynamic(
  () => import("./followups-view").then((mod) => mod.FollowupsView),
  {
    loading: () => <TableSkeleton />,
  }
);

export async function FollowupsServer() {
  const ctx = await requirePermission("followups.manage");
  return <FollowupsView user={ctx.user} />;
}
