import * as React from "react";
import dynamic from "next/dynamic";
import { requirePermission } from "@/lib/auth";
import { TableSkeleton } from "@/components/ui/skeletons";

const TeamView = dynamic(
  () => import("./team-view").then((mod) => mod.TeamView),
  {
    loading: () => <TableSkeleton />,
  }
);

export async function TeamServer() {
  const ctx = await requirePermission("team.view");
  return <TeamView user={ctx.user} />;
}
