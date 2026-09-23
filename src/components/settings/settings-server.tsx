import * as React from "react";
import dynamic from "next/dynamic";
import { requireUser } from "@/lib/auth";
import { FormSkeleton } from "@/components/ui/skeletons";

const SettingsView = dynamic(
  () => import("./settings-view").then((mod) => mod.SettingsView),
  {
    loading: () => <FormSkeleton />,
  }
);

export async function SettingsServer() {
  const ctx = await requireUser();
  return <SettingsView user={ctx.user} />;
}
