import "server-only";

import prisma from "@/lib/db";
import { ApiError } from "@/lib/auth";
import { createActivity, createAuditLog } from "@/lib/track";
import type { FollowupInput } from "@/lib/validation";

export type FollowupFilter = {
  bucket?: "today" | "overdue" | "upcoming" | "all" | "completed";
  brandId?: string;
  influencerId?: string;
  assignedToId?: string;
  status?: string;
};

export async function listFollowups(filters: FollowupFilter = {}) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayStart.getDate() + 1);

  const where: any = {};
  if (filters.brandId) where.brandId = filters.brandId;
  if (filters.influencerId) where.influencerId = filters.influencerId;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;

  if (filters.bucket === "today") {
    where.status = "PENDING";
    where.dueDate = { gte: todayStart, lt: todayEnd };
  } else if (filters.bucket === "overdue") {
    where.status = "PENDING";
    where.dueDate = { lt: todayStart };
  } else if (filters.bucket === "upcoming") {
    where.status = "PENDING";
    where.dueDate = { gte: todayEnd };
  } else if (filters.bucket === "completed") {
    where.status = "COMPLETED";
  }

  if (filters.status) where.status = filters.status;

  const followups = await prisma.followup.findMany({
    where,
    include: {
      brand: { select: { id: true, name: true, status: { select: { name: true, color: true } }, email: true, phone: true } },
      influencer: { select: { id: true, name: true, instagramUsername: true, email: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return followups;
}

export async function createFollowup(input: FollowupInput, actor: { id: string; name: string }) {
  if (!input.brandId && !input.influencerId) {
    throw new ApiError(422, "Link the follow-up to a brand or influencer");
  }
  if (!input.dueDate || isNaN(new Date(input.dueDate).getTime())) {
    throw new ApiError(422, "A valid follow-up date is required");
  }

  const followup = await prisma.followup.create({
    data: {
      brandId: input.brandId ?? null,
      influencerId: input.influencerId ?? null,
      contactType: input.contactType,
      dueDate: input.dueDate,
      status: "PENDING",
      priority: input.priority,
      notes: input.notes,
      assignedToId: input.assignedToId || actor.id,
    },
  });

  const dueLabel = new Date(input.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  // Update the parent record's next follow-up date.
  if (input.brandId) {
    await prisma.brand.update({ where: { id: input.brandId }, data: { nextFollowUpAt: input.dueDate } });
  }
  if (input.influencerId) {
    await prisma.influencer.update({ where: { id: input.influencerId }, data: { nextFollowUpAt: input.dueDate } });
  }

  await createActivity({
    brandId: input.brandId,
    influencerId: input.influencerId,
    type: "FOLLOW_UP_CREATED",
    description: `Follow-up created for ${dueLabel}${input.notes ? ` — ${input.notes}` : ""}`,
    meta: { dueDate: input.dueDate, followupId: followup.id },
    userId: actor.id,
  });
  await createAuditLog({ userId: actor.id, action: "CREATE", recordType: "Followup", recordId: followup.id, newValue: { dueDate: input.dueDate } });

  return followup;
}

export async function completeFollowup(id: string, actor: { id: string; name: string }, notes?: string) {
  const existing = await prisma.followup.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Follow-up not found");

  const updated = await prisma.followup.update({
    where: { id },
    data: { status: "COMPLETED", completedAt: new Date(), completedById: actor.id, notes: notes || existing.notes },
  });

  await createActivity({
    brandId: existing.brandId,
    influencerId: existing.influencerId,
    type: "FOLLOW_UP_COMPLETED",
    description: `Follow-up completed${notes ? ` — ${notes}` : ""}`,
    userId: actor.id,
  });
  await createAuditLog({ userId: actor.id, action: "UPDATE", recordType: "Followup", recordId: id, previousValue: { status: existing.status }, newValue: { status: "COMPLETED" } });
  return updated;
}

export async function rescheduleFollowup(id: string, dueDate: Date, actor: { id: string }) {
  const existing = await prisma.followup.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Follow-up not found");
  const updated = await prisma.followup.update({
    where: { id },
    data: { dueDate, status: "PENDING" },
  });
  if (existing.brandId) {
    await prisma.brand.update({ where: { id: existing.brandId }, data: { nextFollowUpAt: dueDate } });
  }
  if (existing.influencerId) {
    await prisma.influencer.update({ where: { id: existing.influencerId }, data: { nextFollowUpAt: dueDate } });
  }
  await createActivity({
    brandId: existing.brandId,
    influencerId: existing.influencerId,
    type: "FOLLOW_UP_CREATED",
    description: `Follow-up rescheduled to ${dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`,
    userId: actor.id,
  });
  await createAuditLog({ userId: actor.id, action: "UPDATE", recordType: "Followup", recordId: id, previousValue: { dueDate: existing.dueDate }, newValue: { dueDate } });
  return updated;
}

/** Mark the linked entity with a response outcome and close the follow-up. */
export async function markFollowupOutcome(
  id: string,
  outcome: "INTERESTED" | "NOT_INTERESTED" | "NO_RESPONSE",
  actor: { id: string; name: string },
  notes?: string
) {
  const existing = await prisma.followup.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Follow-up not found");

  const targetStatusName =
    outcome === "INTERESTED" ? "INTERESTED" : outcome === "NOT_INTERESTED" ? "NOT INTERESTED" : "NO RESPONSE";

  if (existing.brandId) {
    const status = await prisma.brandStatus.findFirst({ where: { name: targetStatusName } });
    if (status) {
      await prisma.brand.update({ where: { id: existing.brandId }, data: { statusId: status.id } });
      await createActivity({
        brandId: existing.brandId,
        type: "STATUS_CHANGED",
        description: `Status changed to ${targetStatusName} (follow-up outcome)`,
        newValue: targetStatusName,
        userId: actor.id,
      });
    }
  }
  if (existing.influencerId) {
    const status = await prisma.influencerStatus.findFirst({ where: { name: targetStatusName } });
    if (status) {
      await prisma.influencer.update({ where: { id: existing.influencerId }, data: { statusId: status.id } });
      await createActivity({
        influencerId: existing.influencerId,
        type: "STATUS_CHANGED",
        description: `Status changed to ${targetStatusName} (follow-up outcome)`,
        newValue: targetStatusName,
        userId: actor.id,
      });
    }
  }

  await prisma.response.create({
    data: {
      brandId: existing.brandId,
      influencerId: existing.influencerId,
      type: outcome,
      text: notes ?? null,
      channel: existing.contactType,
      recordedById: actor.id,
    },
  });

  const updated = await prisma.followup.update({
    where: { id },
    data: { status: "COMPLETED", completedAt: new Date(), completedById: actor.id, notes: notes || existing.notes },
  });

  await createActivity({
    brandId: existing.brandId,
    influencerId: existing.influencerId,
    type: "FOLLOW_UP_COMPLETED",
    description: `Follow-up outcome: ${outcome.replace("_", " ")}`,
    userId: actor.id,
  });
  await createAuditLog({
    userId: actor.id,
    action: "UPDATE",
    recordType: "Followup",
    recordId: id,
    newValue: { status: "COMPLETED", outcome },
  });
  return updated;
}