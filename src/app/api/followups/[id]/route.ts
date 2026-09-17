import { NextResponse, type NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/auth";
import { completeFollowup, rescheduleFollowup, markFollowupOutcome } from "@/lib/records/followups";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/followups/[id]">) {
  try {
    const userCtx = await apiRequirePermission("followups.manage");
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const action = body.action as string | undefined;

    if (action === "complete") {
      const followup = await completeFollowup(id, userCtx.user, body.notes);
      return NextResponse.json({ followup });
    }
    if (action === "reschedule") {
      const dueDate = new Date(body.dueDate);
      if (isNaN(dueDate.getTime())) return NextResponse.json({ error: "A valid date is required" }, { status: 422 });
      const followup = await rescheduleFollowup(id, dueDate, userCtx.user);
      return NextResponse.json({ followup });
    }
    if (action === "outcome") {
      const outcome = body.outcome as string | undefined;
      if (!["INTERESTED", "NOT_INTERESTED", "NO_RESPONSE"].includes(outcome ?? "")) {
        return NextResponse.json({ error: "Invalid outcome" }, { status: 422 });
      }
      const followup = await markFollowupOutcome(id, outcome as any, userCtx.user, body.notes);
      return NextResponse.json({ followup });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 422 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}