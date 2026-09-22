import { Suspense } from "react";
import { OutreachServer } from "@/components/outreach/outreach-server";
import { TableSkeleton } from "@/components/ui/skeletons";

export default function OutreachPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <OutreachServer />
    </Suspense>
  );
}