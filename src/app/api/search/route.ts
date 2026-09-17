import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireUser();
    const sp = req.nextUrl.searchParams;
    const q = (sp.get("q") ?? "").trim();
    if (!q) return NextResponse.json({ brands: [], influencers: [], campaigns: [], users: [] });

    const [brands, influencers, campaigns, users] = await Promise.all([
      prisma.brand.findMany({
        where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { companyName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] },
        include: { status: { select: { name: true, color: true } } },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      prisma.influencer.findMany({
        where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { instagramUsername: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] },
        include: { status: { select: { name: true, color: true } } },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      prisma.campaign.findMany({
        where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      user.role === "SUPER_ADMIN"
        ? prisma.user.findMany({
            where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] },
            select: { id: true, name: true, email: true, role: true },
            take: 5,
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({ brands, influencers, campaigns, users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}