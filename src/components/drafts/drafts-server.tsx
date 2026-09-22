import * as React from "react";
import dynamic from "next/dynamic";
import { requirePermission } from "@/lib/auth";
import { TableSkeleton } from "@/components/ui/skeletons";

const DraftsView = dynamic(
  () => import("./drafts-view").then((mod) => mod.DraftsView),
  {
    loading: () => <TableSkeleton />,
  }
);

export async function DraftsServer() {
  const ctx = await requirePermission("outreach.manage");
  return <DraftsView user={ctx.user} />;
}
