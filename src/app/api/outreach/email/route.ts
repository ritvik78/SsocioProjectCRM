import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiRequirePermission } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await apiRequirePermission("emails.send");
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "20")));
    const status = sp.get("deliveryStatus") ?? undefined;
    const q = sp.get("q") ?? undefined;
    const brandId = sp.get("brandId") ?? undefined;
    const influencerId = sp.get("influencerId") ?? undefined;

    const where: any = {
      ...(status ? { deliveryStatus: status } : {}),
      ...(brandId ? { brandId } : {}),
      ...(influencerId ? { influencerId } : {}),
      ...(q ? { OR: [{ recipient: { contains: q, mode: "insensitive" } }, { subject: { contains: q, mode: "insensitive" } }] } : {}),
    };

    const [messages, total] = await Promise.all([
      prisma.emailMessage.findMany({
        where,
        include: {
          brand: { select: { id: true, name: true } },
          influencer: { select: { id: true, name: true } },
          template: { select: { id: true, name: true } },
          sentBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.emailMessage.count({ where }),
    ]);

    return NextResponse.json({ messages, total, page, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}