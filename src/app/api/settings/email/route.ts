import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiRequirePermission } from "@/lib/auth";
import { getEmailSettings, saveEmailSettings } from "@/lib/email/settings";
import { emailSettingsSchema } from "@/lib/validation";
import { createAuditLog } from "@/lib/track";

export async function GET() {
  try {
    await apiRequirePermission("permissions.manage");
    const settings = await getEmailSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed" }, { status: error.status ?? 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await apiRequirePermission("permissions.manage");
    const body = await req.json().catch(() => ({}));
    const parsed = emailSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please fix the form errors" }, { status: 422 });
    }
    // Preserve the existing stored API key when none is provided.
    let apiKey = parsed.data.apiKey;
    if (!apiKey) {
      const row = await prisma.setting.findUnique({ where: { key: "email.provider" } });
      if (row) {
        try {
          const parsedRow = JSON.parse(row.value);
          apiKey = parsedRow.apiKey;
        } catch {}
      }
    }

    await saveEmailSettings({
      provider: parsed.data.provider,
      senderEmail: parsed.data.senderEmail,
      senderName: parsed.data.senderName,
      replyTo: parsed.data.replyTo ?? undefined,
      apiKey,
    });

    await createAuditLog({
      userId: ctx.user.id,
      action: "UPDATE",
      recordType: "Setting",
      recordId: "email.provider",
      newValue: { provider: parsed.data.provider, senderEmail: parsed.data.senderEmail, senderName: parsed.data.senderName },
    });

    return NextResponse.json({ ok: true, settings: await getEmailSettings() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to save settings" }, { status: error.status ?? 500 });
  }
}