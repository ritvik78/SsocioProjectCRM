import { requirePermission } from "@/lib/auth";
import { FollowupsView } from "@/components/followups/followups-view";

export default async function FollowupsPage() {
  const ctx = await requirePermission("followups.manage");
  return <FollowupsView user={ctx.user} />;
}