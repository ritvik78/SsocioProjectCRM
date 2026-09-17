import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(todayStart.getDate() + 1);
    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);

    const [
      brandStatuses,
      influencerStatuses,
      campaignsByStatus,
      brandTotal,
      influencerTotal,
      campaignTotal,
      emailTotal,
      emailDelivered,
      emailOpened,
      emailClicked,
      followupsToday,
      followupsOverdue,
      followupsCompleted30,
      responseCounts,
      emailByDay,
      topInfluencers,
      topBrands,
      recentCampaigns,
    ] = await Promise.all([
      prisma.brandStatus.findMany({ include: { _count: { select: { brands: true } } }, orderBy: { order: "asc" } }),
      prisma.influencerStatus.findMany({ include: { _count: { select: { influencers: true } } }, orderBy: { order: "asc" } }),
      prisma.campaign.groupBy({ by: ["status"], _count: true }),
      prisma.brand.count(),
      prisma.influencer.count(),
      prisma.campaign.count(),
      prisma.emailMessage.count({ where: { createdAt: { gte: since30 } } }),
      prisma.emailMessage.count({ where: { createdAt: { gte: since30 }, deliveryStatus: "DELIVERED" } }),
      prisma.emailMessage.count({ where: { createdAt: { gte: since30 }, openStatus: true } }),
      prisma.emailMessage.count({ where: { createdAt: { gte: since30 }, clickStatus: true } }),
      prisma.followup.count({ where: { status: "PENDING", dueDate: { gte: todayStart, lt: tomorrow } } }),
      prisma.followup.count({ where: { status: "PENDING", dueDate: { lt: todayStart } } }),
      prisma.followup.count({ where: { status: "COMPLETED", completedAt: { gte: since30 } } }),
      prisma.response.groupBy({ by: ["type"], _count: true }),
      prisma.$queryRaw<Array<{ day: Date; sent: bigint; opened: bigint; clicked: bigint }>>`
        SELECT date_trunc('day', "createdAt")::date AS day,
               COUNT(*) AS sent,
               COUNT(*) FILTER (WHERE "openStatus" = true) AS opened,
               COUNT(*) FILTER (WHERE "clickStatus" = true) AS clicked
        FROM "EmailMessage"
        WHERE "createdAt" >= ${since30}
        GROUP BY 1 ORDER BY 1 ASC
      `,
      prisma.influencer.findMany({ orderBy: { followers: "desc" }, take: 5, select: { id: true, name: true, instagramUsername: true, followers: true, engagementRate: true } }),
      prisma.brand.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, companyName: true, status: { select: { name: true } } } }),
      prisma.campaign.findMany({ include: { brand: { select: { name: true } }, _count: { select: { campaignInfluencers: true } } }, orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

    return NextResponse.json({
      summary: {
        brands: brandTotal,
        influencers: influencerTotal,
        campaigns: campaignTotal,
        emailsSent30: emailTotal,
        emailsDelivered30: emailDelivered,
        emailsOpened30: emailOpened,
        emailsClicked30: emailClicked,
        followupsToday,
        followupsOverdue,
        followupsCompleted30,
      },
      brandStatuses: brandStatuses.map((s) => ({ name: s.name, color: s.color, count: s._count.brands })),
      influencerStatuses: influencerStatuses.map((s) => ({ name: s.name, color: s.color, count: s._count.influencers })),
      campaignsByStatus: campaignsByStatus.map((c: { status: string; _count: number }) => ({ status: c.status, count: c._count })),
      emailByDay: (emailByDay ?? []).map((d) => ({
        day: d.day,
        sent: Number(d.sent),
        opened: Number(d.opened),
        clicked: Number(d.clicked),
      })),
      responseCounts,
      topInfluencers,
      topBrands,
      recentCampaigns,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}