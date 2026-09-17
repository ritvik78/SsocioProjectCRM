import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiRequirePermission } from "@/lib/auth";
import { createActivity, createAuditLog } from "@/lib/track";

export async function GET(req: NextRequest) {
  try {
    await apiRequirePermission("brands.view");
    const sp = req.nextUrl.searchParams;
    const brandId = sp.get("brandId") ?? undefined;
    const influencerId = sp.get("influencerId") ?? undefined;
    const status = sp.get("status") ?? undefined;
    const channel = sp.get("channel") ?? undefined;
    const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "20")));

    const where: any = {
      ...(brandId ? { brandId } : {}),
      ...(influencerId ? { influencerId } : {}),
      ...(status ? { status } : {}),
      ...(channel ? { channel } : {}),
    };

    const [responses, total] = await Promise.all([
      prisma.response.findMany({
        where,
        include: {
          brand: { select: { id: true, name: true } },
          influencer: { select: { id: true, name: true, instagramUsername: true } },
          recordedBy: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.response.count({ where }),
    ]);

    return NextResponse.json({ responses, total, page, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await apiRequirePermission("brands.edit");
    const body = await req.json().catch(() => ({}));
    const { brandId, influencerId, type, text, channel } = body;
    if (!brandId && !influencerId) return NextResponse.json({ error: "A brand or influencer is required" }, { status: 422 });
    if (!["INTERESTED", "NOT_INTERESTED", "NO_RESPONSE"].includes(type ?? "")) {
      return NextResponse.json({ error: "Invalid response type" }, { status: 422 });
    }

    const response = await prisma.response.create({
      data: { brandId: brandId ?? null, influencerId: influencerId ?? null, type, text, channel: channel ?? "EMAIL", recordedById: ctx.user.id },
    });

    await createActivity({
      brandId: brandId ?? null,
      influencerId: influencerId ?? null,
      type: "RESPONSE_ADDED",
      description: `${type.replace("_", " ")}: ${text ?? "no notes"}`,
      userId: ctx.user.id,
    });
    await createAuditLog({ userId: ctx.user.id, action: "CREATE", recordType: "Response", recordId: response.id, newValue: { type } });
    return NextResponse.json({ response }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}