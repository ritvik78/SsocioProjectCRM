import { Suspense } from "react";
import { TasksServer } from "@/components/tasks/tasks-server";
import { CardGridSkeleton } from "@/components/ui/skeletons";

export default function TasksPage() {
  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <TasksServer />
    </Suspense>
  );
}