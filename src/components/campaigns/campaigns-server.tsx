import * as React from "react";
import dynamic from "next/dynamic";
import { requirePermission } from "@/lib/auth";
import { TableSkeleton } from "@/components/ui/skeletons";

const CampaignsView = dynamic(
  () => import("./campaigns-view").then((mod) => mod.CampaignsView),
  {
    loading: () => <TableSkeleton />,
  }
);

export async function CampaignsServer() {
  const ctx = await requirePermission("campaigns.manage");
  return <CampaignsView user={ctx.user} />;
}
