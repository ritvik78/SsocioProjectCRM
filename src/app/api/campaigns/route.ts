import { NextResponse, type NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/auth";
import { listCampaigns, createCampaign } from "@/lib/records/campaigns";
import { campaignSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    await apiRequirePermission("campaigns.view");
    const sp = req.nextUrl.searchParams;
    const data = await listCampaigns({
      search: sp.get("q") ?? undefined,
      status: sp.get("status") ?? undefined,
      brandId: sp.get("brandId") ?? undefined,
      page: sp.get("page") ? parseInt(sp.get("page")!) : 1,
      pageSize: sp.get("pageSize") ? parseInt(sp.get("pageSize")!) : 20,
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await apiRequirePermission("campaigns.manage");
    const body = await req.json().catch(() => ({}));
    const parsed = campaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please fix the form errors" }, { status: 422 });
    }
    const campaign = await createCampaign(parsed.data, ctx.user);
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to create campaign" }, { status: error.status ?? 500 });
  }
}