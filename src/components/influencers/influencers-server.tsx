import * as React from "react";
import dynamic from "next/dynamic";
import { requirePermission } from "@/lib/auth";
import { TableSkeleton } from "@/components/ui/skeletons";

const InfluencersView = dynamic(
  () => import("./influencers-view").then((mod) => mod.InfluencersView),
  {
    loading: () => <TableSkeleton />,
  }
);

export async function InfluencersServer() {
  const ctx = await requirePermission("influencers.view");
  return <InfluencersView user={ctx.user} />;
}
