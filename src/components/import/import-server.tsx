import * as React from "react";
import dynamic from "next/dynamic";
import { requirePermission } from "@/lib/auth";
import { CardGridSkeleton } from "@/components/ui/skeletons";

const ImportView = dynamic(
  () => import("./import-view").then((mod) => mod.ImportView),
  {
    loading: () => <CardGridSkeleton count={2} />,
  }
);

export async function ImportServer() {
  await requirePermission("import.manage");
  return <ImportView />;
}
