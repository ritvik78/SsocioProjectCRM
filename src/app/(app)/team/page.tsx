import { Suspense } from "react";
import { TeamServer } from "@/components/team/team-server";
import { TableSkeleton } from "@/components/ui/skeletons";

export default function TeamPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <TeamServer />
    </Suspense>
  );
}