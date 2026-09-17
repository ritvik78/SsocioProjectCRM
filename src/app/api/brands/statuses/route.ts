import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiRequirePermission } from "@/lib/auth";
import { BRAND_STATUSES, INFLUENCER_STATUSES } from "@/lib/constants";
import { createAuditLog } from "@/lib/track";

// GET /api/brands/statuses → statuses for a given type
// POST /api/brands/statuses → add a custom status (admin)
export async function GET(req: Request) {
  try {
    await apiRequirePermission("brands.view");
    const url = new URL(req.url);
    const type = url.searchParams.get("type") ?? "brand";

    if (type === "influencer") {
      const statuses = await prisma.influencerStatus.findMany({ orderBy: { order: "asc" } });
      return NextResponse.json({ statuses });
    }
    const statuses = await prisma.brandStatus.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json({ statuses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await apiRequirePermission("brands.edit");
    const body = await req.json().catch(() => ({}));
    const { type, name, color } = body;
    if (!name?.trim()) return NextResponse.json({ error: "Status name is required" }, { status: 422 });

    if (type === "influencer") {
      const existing = await prisma.influencerStatus.findFirst({ where: { name: { equals: name.trim().toUpperCase(), mode: "insensitive" } } });
      if (existing) return NextResponse.json({ error: "This status already exists" }, { status: 409 });
      const status = await prisma.influencerStatus.create({
        data: {
          name: name.trim().toUpperCase(),
          color: color || "#6b7280",
          order: INFLUENCER_STATUSES.length + 1,
        },
      });
      await createAuditLog({ userId: ctx.user.id, action: "CREATE", recordType: "InfluencerStatus", recordId: status.id, newValue: { name: status.name, color: status.color } });
      return NextResponse.json({ status }, { status: 201 });
    }

    const existing = await prisma.brandStatus.findFirst({ where: { name: { equals: name.trim().toUpperCase(), mode: "insensitive" } } });
    if (existing) return NextResponse.json({ error: "This status already exists" }, { status: 409 });
    const status = await prisma.brandStatus.create({
      data: {
        name: name.trim().toUpperCase(),
        color: color || "#6b7280",
        order: BRAND_STATUSES.length + 1,
      },
    });
    await createAuditLog({ userId: ctx.user.id, action: "CREATE", recordType: "BrandStatus", recordId: status.id, newValue: { name: status.name, color: status.color } });
    return NextResponse.json({ status }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}