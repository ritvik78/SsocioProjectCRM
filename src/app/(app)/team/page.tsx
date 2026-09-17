import { requirePermission } from "@/lib/auth";
import { TeamView } from "@/components/team/team-view";

export default async function TeamPage() {
  const ctx = await requirePermission("team.manage");
  return <TeamView user={ctx.user} />;
}