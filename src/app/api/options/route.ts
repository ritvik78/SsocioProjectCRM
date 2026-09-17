import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser();
    const [brandStatuses, influencerStatuses, members] = await Promise.all([
      prisma.brandStatus.findMany({ orderBy: { order: "asc" } }),
      prisma.influencerStatus.findMany({ orderBy: { order: "asc" } }),
      prisma.user.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return NextResponse.json({ brandStatuses, influencerStatuses, members });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}