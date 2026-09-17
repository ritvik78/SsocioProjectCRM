import { requirePermission } from "@/lib/auth";
import { CampaignsView } from "@/components/campaigns/campaigns-view";

export default async function CampaignsPage() {
  const ctx = await requirePermission("campaigns.manage");
  return <CampaignsView user={ctx.user} />;
}