import { requirePermission } from "@/lib/auth";
import { CampaignDetail } from "@/components/campaigns/campaign-detail";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePermission("campaigns.manage");
  const { id } = await params;
  return <CampaignDetail id={id} user={ctx.user} />;
}