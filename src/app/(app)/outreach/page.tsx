import { requirePermission } from "@/lib/auth";
import { OutreachView } from "@/components/outreach/outreach-view";

export default async function OutreachPage() {
  const ctx = await requirePermission("outreach.manage");
  return <OutreachView user={ctx.user} />;
}