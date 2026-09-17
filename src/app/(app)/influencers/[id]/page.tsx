import { requirePermission } from "@/lib/auth";
import { InfluencerDetail } from "@/components/influencers/influencer-detail";

export default async function InfluencerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePermission("influencers.view");
  const { id } = await params;
  return <InfluencerDetail id={id} user={ctx.user} />;
}