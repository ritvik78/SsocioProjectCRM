import * as React from "react";
import dynamic from "next/dynamic";
import { requirePermission } from "@/lib/auth";
import { FormSkeleton } from "@/components/ui/skeletons";

const SettingsView = dynamic(
  () => import("./settings-view").then((mod) => mod.SettingsView),
  {
    loading: () => <FormSkeleton />,
  }
);

export async function SettingsServer() {
  const ctx = await requirePermission("settings.manage");
  return <SettingsView user={ctx.user} />;
}
