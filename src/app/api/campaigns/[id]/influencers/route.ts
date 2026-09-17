import { NextResponse, type NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/auth";
import { addInfluencerToCampaign, removeInfluencerFromCampaign } from "@/lib/records/campaigns";

export async function POST(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/influencers">) {
  try {
    const userCtx = await apiRequirePermission("campaigns.manage");
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const { influencerId, action } = body;
    if (!influencerId) return NextResponse.json({ error: "influencerId is required" }, { status: 422 });

    if (action === "remove") {
      await removeInfluencerFromCampaign(id, influencerId, userCtx.user);
    } else {
      await addInfluencerToCampaign(id, influencerId, userCtx.user);
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}