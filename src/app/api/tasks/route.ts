import { NextResponse, type NextRequest } from "next/server";
import { apiUser } from "@/lib/auth";
import { listTasksForUser } from "@/lib/records/tasks";
import { parseISO } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const ctx = await apiUser();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sp = req.nextUrl.searchParams;
    const fromRaw = sp.get("from");
    const toRaw = sp.get("to");

    let from: Date | undefined;
    let to: Date | undefined;
    if (fromRaw) {
      const d = parseISO(`${fromRaw}T00:00:00`);
      if (!isNaN(d.getTime())) from = d;
    }
    if (toRaw) {
      const d = parseISO(`${toRaw}T23:59:59.999`);
      if (!isNaN(d.getTime())) to = d;
    }

    // No explicit range -> the next 7 days starting today (pending only).
    const tasks = await listTasksForUser(ctx.user.id, {
      from,
      to,
      includeCompleted: Boolean(from && to),
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}