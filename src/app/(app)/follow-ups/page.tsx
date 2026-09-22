import { Suspense } from "react";
import { FollowupsServer } from "@/components/followups/followups-server";
import { TableSkeleton } from "@/components/ui/skeletons";

export default function FollowupsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <FollowupsServer />
    </Suspense>
  );
}