import { requireUser } from "@/lib/auth";
import { ActivityView } from "@/components/activity/activity-view";

export default async function ActivityPage() {
  await requireUser();
  return <ActivityView />;
}