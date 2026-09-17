import { NextResponse, type NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/auth";
import { addInfluencerNote } from "@/lib/records/influencers";

export async function POST(req: NextRequest, ctx: RouteContext<"/api/influencers/[id]/note">) {
  try {
    const userCtx = await apiRequirePermission("influencers.edit");
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const activity = await addInfluencerNote(id, body.note ?? "", userCtx.user);
    return NextResponse.json({ activity });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to add note" }, { status: error.status ?? 500 });
  }
}