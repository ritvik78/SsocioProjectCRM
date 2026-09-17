import "server-only";

import prisma from "@/lib/db";
import { ApiError } from "@/lib/auth";
import { createActivity } from "@/lib/track";

/**
 * Instagram integration adapter.
 *
 * There is no official Instagram/Meta messaging API configured today, so
 * automatic DM sending is disabled. Outreach is recorded in the CRM and the
 * team member uses COPY MESSAGE / OPEN INSTAGRAM to complete the send manually.
 *
 * When an official API is available, implement `sendMessage` and set
 * `canSend` to true without touching any other part of the application.
 */
export interface InstagramAdapter {
  readonly id: string;
  readonly canSend: boolean;
  sendMessage(params: {
    username: string;
    message: string;
    text: string;
  }): Promise<{ status: "SENT" | "MANUAL_REQUIRED"; externalId?: string }>;
}

export class ManualInstagramAdapter implements InstagramAdapter {
  readonly id = "manual";
  readonly canSend = false;

  async sendMessage() {
    return { status: "MANUAL_REQUIRED" as const };
  }
}

export const instagramAdapter: InstagramAdapter = new ManualInstagramAdapter();

export function buildInstagramMessage(templateBody: string, ctx: Record<string, string>) {
  return templateBody.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (match, key: string) => {
    const lower = key.toLowerCase();
    return ctx[lower] ?? match;
  });
}

export async function recordInstagramOutreach(input: {
  influencerId?: string | null;
  instagramUsername: string;
  instagramUrl?: string | null;
  outreachDate?: Date | null;
  message?: string | null;
  outreachType?: string;
  assignedToId?: string | null;
  followUpDate?: Date | null;
  status?: string;
  notes?: string | null;
  actorId: string;
}) {
  const { influencerId, instagramUsername, instagramUrl, outreachDate, message, outreachType, assignedToId, followUpDate, status, notes, actorId } = input;
  if (!instagramUsername) throw new ApiError(422, "Instagram username is required");

  const rec = await prisma.instagramOutreach.create({
    data: {
      influencerId: influencerId ?? null,
      instagramUsername: instagramUsername.replace(/^@/, ""),
      instagramUrl: instagramUrl ?? null,
      outreachDate: outreachDate ?? new Date(),
      message: message ?? null,
      outreachType: outreachType ?? "DM",
      assignedToId: assignedToId ?? actorId,
      followUpDate: followUpDate ?? null,
      status: status ?? "MESSAGE_SENT",
      notes: notes ?? null,
    },
  });

  await createActivity({
    influencerId,
    type: "INSTAGRAM_OUTREACH",
    description: `Instagram ${outreachType ?? "DM"} sent to @${instagramUsername.replace(/^@/, "")}${
      followUpDate ? ` — follow-up ${new Date(followUpDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""
    }`,
    meta: { outreachId: rec.id, username: instagramUsername, message, followUpDate },
    userId: actorId,
  });

  if (influencerId) {
    await prisma.influencer.update({ where: { id: influencerId }, data: { lastContactedAt: new Date() } });
  }

  return rec;
}