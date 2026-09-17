import { NextResponse, type NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/auth";
import { listBrands, createBrand } from "@/lib/records/brands";
import { brandSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    await apiRequirePermission("brands.view");
    const sp = req.nextUrl.searchParams;
    const data = await listBrands({
      search: sp.get("q") ?? undefined,
      statusId: sp.get("status") ?? undefined,
      ownerId: sp.get("owner") ?? undefined,
      priority: sp.get("priority") ?? undefined,
      industry: sp.get("industry") ?? undefined,
      source: sp.get("source") ?? undefined,
      campaignStatus: sp.get("campaignStatus") ?? undefined,
      city: sp.get("city") ?? undefined,
      onboardedOnly: sp.get("onboarded") === "1",
      contactable: sp.get("contactable") === "1",
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
    const ctx = await apiRequirePermission("brands.add");
    const body = await req.json().catch(() => ({}));
    const parsed = brandSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please fix the form errors", details: parsed.error.flatten().fieldErrors }, { status: 422 });
    }
    const brand = await createBrand({ ...parsed.data, leadOwnerId: parsed.data.leadOwnerId || ctx.user.id }, ctx.user);
    return NextResponse.json({ brand }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to create brand" }, { status: error.status ?? 500 });
  }
}