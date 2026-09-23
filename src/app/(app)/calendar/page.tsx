import { Suspense } from "react";
import { CalendarServer } from "@/components/calendar/calendar-server";
import { TableSkeleton } from "@/components/ui/skeletons";

export default function CalendarPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <CalendarServer />
    </Suspense>
  );
}