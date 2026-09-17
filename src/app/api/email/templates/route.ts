import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiRequirePermission } from "@/lib/auth";
import { emailTemplateSchema } from "@/lib/validation";
import { createActivity, createAuditLog } from "@/lib/track";

export async function GET(req: NextRequest) {
  try {
    await apiRequirePermission("brands.view");
    const sp = req.nextUrl.searchParams;
    const category = sp.get("category") ?? undefined;
    const active = sp.get("active") === "1";
    const q = sp.get("q") ?? undefined;

    const templates = await prisma.emailTemplate.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(active ? { status: "ACTIVE" } : {}),
        ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { subject: { contains: q, mode: "insensitive" } }] } : {}),
      },
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ templates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await apiRequirePermission("drafts.manage");
    const body = await req.json().catch(() => ({}));
    const parsed = emailTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please fix the form errors" }, { status: 422 });
    }
    const template = await prisma.emailTemplate.create({
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        subject: parsed.data.subject,
        body: parsed.data.body,
        variables: parsed.data.variables as any,
        status: parsed.data.status,
        createdById: ctx.user.id,
      },
    });
    await createActivity({ type: "UPDATED", description: `Email draft created: ${template.name}`, userId: ctx.user.id });
    await createAuditLog({ userId: ctx.user.id, action: "CREATE", recordType: "EmailTemplate", recordId: template.id, newValue: { name: template.name, category: template.category } });
    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to create draft" }, { status: error.status ?? 500 });
  }
}