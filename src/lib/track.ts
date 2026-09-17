import "server-only";

import prisma from "@/lib/db";

type ActivityInput = {
  brandId?: string | null;
  influencerId?: string | null;
  campaignId?: string | null;
  type: string;
  description: string;
  meta?: Record<string, unknown>;
  previousValue?: string | null;
  newValue?: string | null;
  userId?: string | null;
};

export async function createActivity(input: ActivityInput) {
  const { brandId, influencerId, campaignId, type, description, meta, previousValue, newValue, userId } = input;
  try {
    return await prisma.activity.create({
      data: {
        brandId: brandId ?? null,
        influencerId: influencerId ?? null,
        campaignId: campaignId ?? null,
        type,
        description,
        meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined,
        previousValue,
        newValue,
        userId: userId ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to create activity:", error);
    return null;
  }
}

export async function createAuditLog(input: {
  userId?: string | null;
  action: string;
  recordType?: string | null;
  recordId?: string | null;
  previousValue?: unknown;
  newValue?: unknown;
}) {
  try {
    const clone = (v: unknown) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
    return await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        recordType: input.recordType ?? null,
        recordId: input.recordId ?? null,
        previousValue: clone(input.previousValue),
        newValue: clone(input.newValue),
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    return null;
  }
}

export type NotificationType =
  | "FOLLOWUP_DUE"
  | "FOLLOWUP_OVERDUE"
  | "NEW_RESPONSE"
  | "NEW_LEAD"
  | "ONBOARDING_COMPLETED"
  | "CAMPAIGN_INVITE_RESPONSE"
  | "TEAM_INVITE"
  | "EMAIL_FOLLOWUP"
  | "CAMPAIGN_CREATED";

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

/** Raises a notification for an entity's owner when present. */
export async function notifyEntityOwner(input: {
  userId?: string | null;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
}) {
  if (!input.userId) return null;
  return createNotification({
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link,
  });
}

export async function notifyRoleOrOwner(input: {
  ownerId?: string | null;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
}) {
  return notifyEntityOwner(input as { userId?: string | null; type: NotificationType; title: string; message?: string; link?: string });
}

export async function recordFollowupAutomation(input: {
  userId?: string | null;
  brandId?: string | null;
  influencerId?: string | null;
  description: string;
  link?: string;
}) {
  return notifyEntityOwner({
    userId: input.userId,
    type: "FOLLOWUP_DUE",
    title: "Follow-up Due",
    message: input.description,
    link: input.link,
  });
}