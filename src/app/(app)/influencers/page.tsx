import { requirePermission } from "@/lib/auth";
import { InfluencersView } from "@/components/influencers/influencers-view";

export default async function InfluencersPage() {
  const ctx = await requirePermission("influencers.view");
  return <InfluencersView user={ctx.user} />;
}