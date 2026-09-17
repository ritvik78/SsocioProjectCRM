import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireUser();
    const sp = req.nextUrl.searchParams;
    const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit") ?? "10")));
    const unreadOnly = sp.get("unread") === "1";

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
    return NextResponse.json({ notifications, unread });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { id, all } = body;
    if (all) {
      await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
    } else if (id) {
      await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { readAt: new Date() } });
    } else {
      return NextResponse.json({ error: "id or all is required" }, { status: 422 });
    }
    const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
    return NextResponse.json({ ok: true, unread });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}