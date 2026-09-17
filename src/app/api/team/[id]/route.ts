import { NextResponse, type NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/auth";
import { updateMember, removeMember } from "@/lib/records/team";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/team/[id]">) {
  try {
    const userCtx = await apiRequirePermission("team.manage");
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const member = await updateMember(id, body, userCtx.user);
    return NextResponse.json({ member });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to update member" }, { status: error.status ?? 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/team/[id]">) {
  try {
    const userCtx = await apiRequirePermission("team.manage");
    const { id } = await ctx.params;
    await removeMember(id, userCtx.user);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to remove member" }, { status: error.status ?? 500 });
  }
}