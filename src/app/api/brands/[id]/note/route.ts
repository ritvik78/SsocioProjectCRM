import { NextResponse, type NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/auth";
import { addBrandNote } from "@/lib/records/brands";

export async function POST(req: NextRequest, ctx: RouteContext<"/api/brands/[id]/note">) {
  try {
    const userCtx = await apiRequirePermission("brands.edit");
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const note = await addBrandNote(id, body.note ?? "", userCtx.user);
    return NextResponse.json({ activity: note });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to add note" }, { status: error.status ?? 500 });
  }
}