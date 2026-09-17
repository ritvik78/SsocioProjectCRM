import { NextResponse, type NextRequest } from "next/server";
import Papa from "papaparse";
import prisma from "@/lib/db";
import { apiRequirePermission } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await apiRequirePermission("brands.view");
    const sp = req.nextUrl.searchParams;
    const type = sp.get("type") === "influencer" ? "influencer" : "brand";

    if (type === "influencer") {
      const influencers = await prisma.influencer.findMany({ orderBy: { createdAt: "desc" } });
      const rows = influencers.map((r) => ({
        name: r.name,
        instagram_username: r.instagramUsername ?? "",
        email: r.email ?? "",
        phone: r.phone ?? "",
        category: r.category ?? "",
        followers: r.followers ?? "",
        engagement_rate: r.engagementRate ?? "",
        platform: r.platform ?? "INSTAGRAM",
        city: r.city ?? "",
        state: r.state ?? "",
        source: r.source ?? "",
        notes: r.notes ?? "",
      }));
      return respond(Papa.unparse(rows), "influencers-export.csv");
    }

    const brands = await prisma.brand.findMany({
      include: { leadOwner: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
    });
    const rows = brands.map((r) => ({
      name: r.name,
      company_name: r.companyName ?? "",
      contact_name: r.contactName ?? "",
      designation: r.designation ?? "",
      email: r.email ?? "",
      phone: r.phone ?? "",
      website: r.website ?? "",
      instagram_handle: r.instagramHandle ?? "",
      industry: r.industry ?? "",
      city: r.city ?? "",
      state: r.state ?? "",
      source: r.source ?? "",
      lead_owner: r.leadOwner?.email ?? "",
      notes: r.notes ?? "",
    }));
    return respond(Papa.unparse(rows), "brands-export.csv");

    function respond(csv: string, filename: string) {
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}