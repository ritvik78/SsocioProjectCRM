import { NextResponse, type NextRequest } from "next/server";
import { apiUser } from "@/lib/auth";
import { listTasksForUser } from "@/lib/records/tasks";
import { parseISO, startOfDay, endOfDay, addDays } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const ctx = await apiUser();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sp = req.nextUrl.searchParams;
    const fromRaw = sp.get("from");
    const toRaw = sp.get("to");
    const bucket = sp.get("bucket");
    let status = sp.get("status") ?? undefined;
    const q = sp.get("q") ?? undefined;
    const priority = sp.get("priority") ?? undefined;

    let from: Date | undefined;
    let to: Date | undefined;
    let includeCompleted = false;

    if (bucket === "all") {
      includeCompleted = true;
    } else if (bucket === "today") {
      const today = new Date();
      from = startOfDay(today);
      to = endOfDay(today);
    } else if (bucket === "upcoming") {
      const today = new Date();
      from = addDays(startOfDay(today), 1);
      to = addDays(endOfDay(today), 30);
    } else if (bucket === "completed") {
      includeCompleted = true;
      status = "COMPLETED";
    } else {
      if (fromRaw) {
        const d = parseISO(`${fromRaw}T00:00:00`);
        if (!isNaN(d.getTime())) from = d;
      }
      if (toRaw) {
        const d = parseISO(`${toRaw}T23:59:59.999`);
        if (!isNaN(d.getTime())) to = d;
      }
      includeCompleted = Boolean(from && to);
    }

    const tasks = await listTasksForUser(ctx.user.id, {
      from,
      to,
      includeCompleted,
      status,
      q,
      priority,
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}