import dynamic from "next/dynamic";
import { requirePermission } from "@/lib/auth";
import { DetailSkeleton } from "@/components/ui/skeletons";

const InfluencerDetail = dynamic(
  () => import("@/components/influencers/influencer-detail").then((m) => m.InfluencerDetail),
  { loading: () => <DetailSkeleton /> }
);

export default async function InfluencerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePermission("influencers.view");
  const { id } = await params;
  return <InfluencerDetail id={id} user={ctx.user} />;
}