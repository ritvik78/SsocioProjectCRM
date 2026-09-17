import { NextResponse, type NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/auth";
import { getInfluencer, updateInfluencer, deleteInfluencer } from "@/lib/records/influencers";
import { influencerSchema } from "@/lib/validation";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/influencers/[id]">) {
  try {
    await apiRequirePermission("influencers.view");
    const { id } = await ctx.params;
    const influencer = await getInfluencer(id);
    if (!influencer) return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
    return NextResponse.json({ influencer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/influencers/[id]">) {
  try {
    const userCtx = await apiRequirePermission("influencers.edit");
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const parsed = influencerSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please fix the form errors" }, { status: 422 });
    }
    const influencer = await updateInfluencer(id, parsed.data, userCtx.user);
    return NextResponse.json({ influencer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to update influencer" }, { status: error.status ?? 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/influencers/[id]">) {
  try {
    const userCtx = await apiRequirePermission("influencers.delete");
    const { id } = await ctx.params;
    await deleteInfluencer(id, userCtx.user);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to delete influencer" }, { status: error.status ?? 500 });
  }
}