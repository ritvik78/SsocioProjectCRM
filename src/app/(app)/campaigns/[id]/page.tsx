import dynamic from "next/dynamic";
import { requirePermission } from "@/lib/auth";
import { DetailSkeleton } from "@/components/ui/skeletons";

const CampaignDetail = dynamic(
  () => import("@/components/campaigns/campaign-detail").then((m) => m.CampaignDetail),
  { loading: () => <DetailSkeleton /> }
);

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePermission("campaigns.manage");
  const { id } = await params;
  return <CampaignDetail id={id} user={ctx.user} />;
}