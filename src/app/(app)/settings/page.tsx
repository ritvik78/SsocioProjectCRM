import { Suspense } from "react";
import { SettingsServer } from "@/components/settings/settings-server";
import { FormSkeleton } from "@/components/ui/skeletons";

export default function SettingsPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <SettingsServer />
    </Suspense>
  );
}