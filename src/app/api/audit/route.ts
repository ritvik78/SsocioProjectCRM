import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiRequirePermission } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await apiRequirePermission("permissions.manage");
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") ?? "25")));
    const action = sp.get("action") ?? undefined;
    const recordType = sp.get("recordType") ?? undefined;
    const userId = sp.get("userId") ?? undefined;
    const q = sp.get("q") ?? undefined;

    const where: any = {
      ...(action ? { action } : {}),
      ...(recordType ? { recordType } : {}),
      ...(userId ? { userId } : {}),
      ...(q ? { recordType: { contains: q, mode: "insensitive" } } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, page, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}