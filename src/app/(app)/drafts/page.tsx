import { requirePermission } from "@/lib/auth";
import { DraftsView } from "@/components/drafts/drafts-view";

export default async function DraftsPage() {
  const ctx = await requirePermission("drafts.manage");
  return <DraftsView user={ctx.user} />;
}