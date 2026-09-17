import { NextResponse, type NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/auth";
import { sendCampaignInvites } from "@/lib/records/campaigns";

export async function POST(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/invite">) {
  try {
    const userCtx = await apiRequirePermission("emails.send");
    const { id } = await ctx.params;
    const result = await sendCampaignInvites(id, userCtx.user);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to send invitations" }, { status: error.status ?? 500 });
  }
}