import { requirePermission } from "@/lib/auth";
import { SettingsView } from "@/components/settings/settings-view";

export default async function SettingsPage() {
  const ctx = await requirePermission("permissions.manage");
  return <SettingsView user={ctx.user} />;
}