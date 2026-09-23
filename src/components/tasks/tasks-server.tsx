import { requireUser } from "@/lib/auth";
import { TasksView } from "./tasks-view";

export async function TasksServer() {
  await requireUser();
  return <TasksView />;
}