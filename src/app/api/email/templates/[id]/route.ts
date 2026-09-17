import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiRequirePermission } from "@/lib/auth";
import { emailTemplateSchema } from "@/lib/validation";
import { createActivity, createAuditLog } from "@/lib/track";

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/email/templates/[id]">) {
  try {
    const userCtx = await apiRequirePermission("drafts.manage");
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const parsed = emailTemplateSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please fix the form errors" }, { status: 422 });
    }
    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        ...parsed.data,
        variables: parsed.data.variables !== undefined ? (parsed.data.variables as any) : undefined,
      },
    });
    await createActivity({ type: "UPDATED", description: `Email draft updated: ${template.name}`, userId: userCtx.user.id });
    await createAuditLog({ userId: userCtx.user.id, action: "UPDATE", recordType: "EmailTemplate", recordId: id, newValue: { name: template.name } });
    return NextResponse.json({ template });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to update draft" }, { status: error.status ?? 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/email/templates/[id]">) {
  try {
    const userCtx = await apiRequirePermission("drafts.manage");
    const { id } = await ctx.params;
    const template = await prisma.emailTemplate.delete({ where: { id } });
    await createActivity({ type: "DELETED", description: `Email draft archived: ${template.name}`, userId: userCtx.user.id });
    await createAuditLog({ userId: userCtx.user.id, action: "DELETE", recordType: "EmailTemplate", recordId: id, previousValue: { name: template.name } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to delete draft" }, { status: error.status ?? 500 });
  }
}