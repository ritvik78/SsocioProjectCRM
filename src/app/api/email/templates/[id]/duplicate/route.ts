import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiRequirePermission } from "@/lib/auth";
import { createActivity, createAuditLog } from "@/lib/track";

export async function POST(req: NextRequest, ctx: RouteContext<"/api/email/templates/[id]/duplicate">) {
  try {
    const userCtx = await apiRequirePermission("drafts.manage");
    const { id } = await ctx.params;
    const source = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!source) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    const template = await prisma.emailTemplate.create({
      data: {
        name: `${source.name} (copy)`,
        category: source.category,
        subject: source.subject,
        body: source.body,
        variables: (source.variables as string[]) ?? [],
        status: "ACTIVE",
        createdById: userCtx.user.id,
      },
    });
    await createActivity({ type: "UPDATED", description: `Email draft duplicated as: ${template.name}`, userId: userCtx.user.id });
    await createAuditLog({ userId: userCtx.user.id, action: "CREATE", recordType: "EmailTemplate", recordId: template.id, newValue: { name: template.name } });
    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to duplicate draft" }, { status: error.status ?? 500 });
  }
}