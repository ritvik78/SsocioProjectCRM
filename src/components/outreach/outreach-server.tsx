import * as React from "react";
import dynamic from "next/dynamic";
import { requirePermission } from "@/lib/auth";
import { TableSkeleton } from "@/components/ui/skeletons";

const OutreachView = dynamic(
  () => import("./outreach-view").then((mod) => mod.OutreachView),
  {
    loading: () => <TableSkeleton />,
  }
);

export async function OutreachServer() {
  const ctx = await requirePermission("outreach.manage");
  return <OutreachView user={ctx.user} />;
}
