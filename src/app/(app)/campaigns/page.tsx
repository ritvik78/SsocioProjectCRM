import { Suspense } from "react";
import { CampaignsServer } from "@/components/campaigns/campaigns-server";
import { TableSkeleton } from "@/components/ui/skeletons";

export default function CampaignsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <CampaignsServer />
    </Suspense>
  );
}