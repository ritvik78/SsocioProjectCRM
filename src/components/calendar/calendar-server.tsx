import { requireUser } from "@/lib/auth";
import { CalendarView } from "./calendar-view";

export async function CalendarServer() {
  await requireUser();
  return <CalendarView />;
}