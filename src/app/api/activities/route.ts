import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const sp = req.nextUrl.searchParams;
    const brandId = sp.get("brandId") ?? undefined;
    const influencerId = sp.get("influencerId") ?? undefined;
    const campaignId = sp.get("campaignId") ?? undefined;
    const userId = sp.get("userId") ?? undefined;
    const entity = sp.get("entity") ?? undefined;
    const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "30")));

    const where: any = {
      ...(brandId ? { brandId } : {}),
      ...(influencerId ? { influencerId } : {}),
      ...(campaignId ? { campaignId } : {}),
    };
    if (userId) where.userId = userId;
    if (entity === "brand") where.brandId = { not: null };
    if (entity === "influencer") where.influencerId = { not: null };
    if (entity === "campaign") where.campaignId = { not: null };

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          influencer: { select: { id: true, name: true } },
          campaign: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.activity.count({ where }),
    ]);

    return NextResponse.json({ activities, total, page, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}