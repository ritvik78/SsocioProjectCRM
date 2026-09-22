import * as React from "react";
import dynamic from "next/dynamic";
import { requirePermission } from "@/lib/auth";
import { CardGridSkeleton } from "@/components/ui/skeletons";

const BrandsView = dynamic(
  () => import("./brands-view").then((mod) => mod.BrandsView),
  {
    loading: () => <CardGridSkeleton />,
  }
);

export async function BrandsServer() {
  const ctx = await requirePermission("brands.view");
  return <BrandsView user={ctx.user} />;
}
