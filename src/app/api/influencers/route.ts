import { NextResponse, type NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/auth";
import { listInfluencers, createInfluencer } from "@/lib/records/influencers";
import { influencerSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    await apiRequirePermission("influencers.view");
    const sp = req.nextUrl.searchParams;
    const data = await listInfluencers({
      search: sp.get("q") ?? undefined,
      statusId: sp.get("status") ?? undefined,
      assignedToId: sp.get("assignedTo") ?? undefined,
      category: sp.get("category") ?? undefined,
      source: sp.get("source") ?? undefined,
      platform: sp.get("platform") ?? undefined,
      city: sp.get("city") ?? undefined,
      onboardedOnly: sp.get("onboarded") === "1",
      minFollowers: sp.get("minFollowers") ? parseInt(sp.get("minFollowers")!) : undefined,
      createdFrom: sp.get("createdFrom") ?? undefined,
      createdTo: sp.get("createdTo") ?? undefined,
      sort: sp.get("sort") ?? undefined,
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
    const ctx = await apiRequirePermission("influencers.add");
    const body = await req.json().catch(() => ({}));
    const parsed = influencerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please fix the form errors", details: parsed.error.flatten().fieldErrors }, { status: 422 });
    }
    const influencer = await createInfluencer({ ...parsed.data, assignedToId: parsed.data.assignedToId || ctx.user.id }, ctx.user);
    return NextResponse.json({ influencer }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to create influencer" }, { status: error.status ?? 500 });
  }
}