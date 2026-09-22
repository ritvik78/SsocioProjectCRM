import { Suspense } from "react";
import { InfluencersServer } from "@/components/influencers/influencers-server";
import { TableSkeleton } from "@/components/ui/skeletons";

export default function InfluencersPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <InfluencersServer />
    </Suspense>
  );
}