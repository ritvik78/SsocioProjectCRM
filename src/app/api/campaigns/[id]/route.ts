import { NextResponse, type NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/auth";
import { getCampaign, updateCampaign, deleteCampaign } from "@/lib/records/campaigns";
import { campaignSchema } from "@/lib/validation";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]">) {
  try {
    await apiRequirePermission("campaigns.view");
    const { id } = await ctx.params;
    const campaign = await getCampaign(id);
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    return NextResponse.json({ campaign });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]">) {
  try {
    const userCtx = await apiRequirePermission("campaigns.manage");
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const parsed = campaignSchema.partial().safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Please fix the form errors" }, { status: 422 });
    const campaign = await updateCampaign(id, parsed.data, userCtx.user);
    return NextResponse.json({ campaign });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]">) {
  try {
    const userCtx = await apiRequirePermission("campaigns.manage");
    const { id } = await ctx.params;
    await deleteCampaign(id, userCtx.user);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}