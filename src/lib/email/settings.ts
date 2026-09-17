import "server-only";

import prisma from "@/lib/db";
import type { EmailProvider } from "./provider";
import { resendProvider } from "./resend";

export type EmailSettings = {
  provider: string;
  apiKeyConfigured: boolean;
  senderEmail: string;
  senderName: string;
  replyTo?: string;
};

export async function getEmailSettings(): Promise<EmailSettings | null> {
  const row = await prisma.setting.findUnique({ where: { key: "email.provider" } });
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.value);
    return {
      provider: parsed.provider ?? "resend",
      apiKeyConfigured: Boolean(parsed.apiKey) || Boolean(process.env.RESEND_API_KEY),
      senderEmail: parsed.senderEmail,
      senderName: parsed.senderName,
      replyTo: parsed.replyTo,
    };
  } catch {
    return null;
  }
}

export async function saveEmailSettings(settings: Omit<EmailSettings, "apiKeyConfigured"> & { apiKey?: string }) {
  const existing = await prisma.setting.findUnique({ where: { key: "email.provider" } });
  const value = JSON.stringify({
    provider: settings.provider,
    apiKey: settings.apiKey ?? undefined,
    senderEmail: settings.senderEmail,
    senderName: settings.senderName,
    replyTo: settings.replyTo ?? undefined,
  });
  if (existing) {
    return prisma.setting.update({ where: { key: "email.provider" }, data: { value } });
  }
  return prisma.setting.create({ data: { key: "email.provider", value } });
}

function getProvider(): EmailProvider {
  return resendProvider; // Single provider today; swap here to replace later.
}

export { getProvider };

export async function isEmailConfigured() {
  const settings = await getEmailSettings();
  return Boolean(settings && settings.senderEmail && settings.apiKeyConfigured);
}