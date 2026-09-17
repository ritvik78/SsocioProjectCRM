import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiRequirePermission } from "@/lib/auth";
import { recordInstagramOutreach } from "@/lib/instagram/adapter";
import { instagramOutreachSchema } from "@/lib/validation";
import { createActivity, createAuditLog } from "@/lib/track";

export async function GET(req: NextRequest) {
  try {
    await apiRequirePermission("outreach.manage");
    const sp = req.nextUrl.searchParams;
    const influencerId = sp.get("influencerId") ?? undefined;
    const status = sp.get("status") ?? undefined;
    const q = sp.get("q") ?? undefined;
    const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "20")));

    const where: any = {
      ...(influencerId ? { influencerId } : {}),
      ...(status ? { status } : {}),
      ...(q ? { instagramUsername: { contains: q, mode: "insensitive" } } : {}),
    };

    const [outreach, total] = await Promise.all([
      prisma.instagramOutreach.findMany({
        where,
        include: {
          influencer: { select: { id: true, name: true, instagramUsername: true } },
          assignedTo: { select: { id: true, name: true } },
        },
        orderBy: { outreachDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.instagramOutreach.count({ where }),
    ]);

    return NextResponse.json({ outreach, total, page, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await apiRequirePermission("outreach.manage");
    const body = await req.json().catch(() => ({}));
    const parsed = instagramOutreachSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please fill the required fields" }, { status: 422 });
    }

    const outreach = await recordInstagramOutreach({
      influencerId: parsed.data.influencerId,
      instagramUsername: parsed.data.instagramUsername,
      instagramUrl: parsed.data.instagramUrl,
      outreachDate: parsed.data.outreachDate,
      message: parsed.data.message,
      outreachType: parsed.data.outreachType,
      assignedToId: parsed.data.assignedToId || ctx.user.id,
      followUpDate: parsed.data.followUpDate,
      status: parsed.data.status,
      notes: parsed.data.notes,
      actorId: ctx.user.id,
    });

    await createAuditLog({ userId: ctx.user.id, action: "CREATE", recordType: "InstagramOutreach", recordId: outreach.id, newValue: { username: outreach.instagramUsername } });
    return NextResponse.json({ outreach }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to record outreach" }, { status: error.status ?? 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await apiRequirePermission("outreach.manage");
    const body = await req.json().catch(() => ({}));
    const { id, ...rest } = body;
    if (!id) return NextResponse.json({ error: "Outreach id is required" }, { status: 422 });

    const existing = await prisma.instagramOutreach.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Outreach not found" }, { status: 404 });

    const data: any = { ...rest };
    if (data.instagramUsername) data.instagramUsername = data.instagramUsername.replace(/^@/, "");
    const updated = await prisma.instagramOutreach.update({ where: { id }, data });

    if (rest.response && !existing.response) {
      await createActivity({
        influencerId: existing.influencerId,
        type: "RESPONSE_ADDED",
        description: `Instagram response recorded: ${rest.response}`,
        userId: ctx.user.id,
      });
    }
    if (rest.status && rest.status !== existing.status) {
      await createActivity({
        influencerId: existing.influencerId,
        type: "STATUS_CHANGED",
        description: `Instagram outreach status → ${rest.status}`,
        previousValue: existing.status,
        newValue: rest.status,
        userId: ctx.user.id,
      });
    }
    await createAuditLog({ userId: ctx.user.id, action: "UPDATE", recordType: "InstagramOutreach", recordId: id, previousValue: { status: existing.status }, newValue: { status: updated.status } });
    return NextResponse.json({ outreach: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to update outreach" }, { status: error.status ?? 500 });
  }
}