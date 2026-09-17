import "server-only";

import prisma from "@/lib/db";
import { ApiError } from "@/lib/auth";
import { createActivity, createAuditLog, createNotification } from "@/lib/track";
import type { InfluencerInput } from "@/lib/validation";

export async function getDefaultInfluencerStatus() {
  return prisma.influencerStatus.findFirst({ where: { name: "NEW" } });
}

export type InfluencerListParams = {
  search?: string;
  statusId?: string;
  assignedToId?: string;
  category?: string;
  source?: string;
  platform?: string;
  city?: string;
  onboardedOnly?: boolean;
  minFollowers?: number;
  createdFrom?: string;
  createdTo?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export async function listInfluencers(params: InfluencerListParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));

  const where: any = {};
  if (params.search) {
    const q = params.search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { instagramUsername: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }
  if (params.statusId) where.statusId = params.statusId;
  if (params.assignedToId) where.assignedToId = params.assignedToId;
  if (params.category) where.category = params.category;
  if (params.source) where.source = params.source;
  if (params.platform) where.platform = params.platform;
  if (params.city) where.city = { contains: params.city, mode: "insensitive" };
  if (params.onboardedOnly) where.status = { is: { name: "ONBOARDED" } };
  if (params.minFollowers) where.followers = { gte: params.minFollowers };
  if (params.createdFrom || params.createdTo) {
    where.createdAt = {};
    if (params.createdFrom) where.createdAt.gte = new Date(params.createdFrom);
    if (params.createdTo) where.createdAt.lte = new Date(params.createdTo);
  }

  const orderBy: any =
    params.sort === "name"
      ? [{ name: "asc" as const }]
      : params.sort === "followers"
        ? [{ followers: "desc" as const }]
        : params.sort === "last_contacted"
          ? [{ lastContactedAt: "desc" as const }]
          : [{ createdAt: "desc" as const }];

  const [influencers, total] = await Promise.all([
    prisma.influencer.findMany({
      where,
      include: {
        status: true,
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { followups: { where: { status: "PENDING" } }, instagramOutreach: true, campaignInfluencers: true } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.influencer.count({ where }),
  ]);

  return { influencers, total, page, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getInfluencer(id: string) {
  const influencer = await prisma.influencer.findUnique({
    where: { id },
    include: {
      status: true,
      assignedTo: { select: { id: true, name: true, email: true } },
      emailMessages: { orderBy: { createdAt: "desc" }, take: 50 },
      instagramOutreach: { orderBy: { outreachDate: "desc" } },
      responses: { orderBy: { date: "desc" } },
      followups: { orderBy: { dueDate: "asc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 100 },
      campaignInfluencers: { include: { campaign: { include: { brand: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!influencer) return null;
  return influencer;
}

export async function createInfluencer(input: InfluencerInput, actor: { id: string; name: string }) {
  let dup = null;
  if (input.email) {
    dup = await prisma.influencer.findFirst({ where: { email: { equals: input.email.toLowerCase(), mode: "insensitive" } } });
  }
  if (!dup && input.instagramUsername) {
    dup = await prisma.influencer.findFirst({
      where: { instagramUsername: { equals: input.instagramUsername.replace(/^@/, ""), mode: "insensitive" } },
    });
  }
  if (dup) {
    throw new ApiError(409, dup.email === input.email?.toLowerCase() ? "An influencer with this email already exists" : "An influencer with this Instagram username already exists");
  }

  const status = await prisma.influencerStatus.findUnique({ where: { id: input.statusId } });
  if (!status) throw new ApiError(422, "Invalid influencer status");

  const influencer = await prisma.influencer.create({
    data: {
      name: input.name,
      instagramUsername: input.instagramUsername?.replace(/^@/, "") || null,
      instagramUrl: input.instagramUrl,
      email: input.email ? input.email.toLowerCase() : null,
      phone: input.phone,
      city: input.city,
      state: input.state,
      category: input.category,
      followers: input.followers,
      engagementRate: input.engagementRate,
      platform: input.platform,
      audienceLocation: input.audienceLocation,
      source: input.source,
      statusId: input.statusId,
      notes: input.notes,
      assignedToId: input.assignedToId,
      lastContactedAt: input.lastContactedAt,
      nextFollowUpAt: input.nextFollowUpAt,
      onboardingDate: input.onboardingDate,
      contentType: input.contentType,
      preferredCollaboration: input.preferredCollaboration,
      audienceDemographics: input.audienceDemographics,
      portfolio: input.portfolio,
    },
  });

  await createActivity({
    influencerId: influencer.id,
    type: "LEAD_CREATED",
    description: `Influencer added: ${influencer.name}`,
    meta: { status: status.name },
    userId: actor.id,
  });
  await appendInfluencerStatusActivity(influencer.id, status.name, actor.id);
  await createAuditLog({ userId: actor.id, action: "CREATE", recordType: "Influencer", recordId: influencer.id, newValue: { ...influencer } });
  if (influencer.assignedToId && influencer.assignedToId !== actor.id) {
    await createNotification({
      userId: influencer.assignedToId,
      type: "NEW_LEAD",
      title: "New influencer assigned",
      message: influencer.name,
      link: `/influencers/${influencer.id}`,
    });
  }

  return influencer;
}

export async function updateInfluencer(id: string, input: Partial<InfluencerInput>, actor: { id: string; name: string }) {
  const existing = await prisma.influencer.findUnique({ where: { id }, include: { status: true } });
  if (!existing) throw new ApiError(404, "Influencer not found");

  if (input.email) {
    const dup = await prisma.influencer.findFirst({
      where: { email: { equals: input.email.toLowerCase(), mode: "insensitive" }, id: { not: id } },
    });
    if (dup) throw new ApiError(409, "Another influencer already uses this email");
  }
  if (input.instagramUsername) {
    const dup = await prisma.influencer.findFirst({
      where: {
        instagramUsername: { equals: input.instagramUsername.replace(/^@/, ""), mode: "insensitive" },
        id: { not: id },
      },
    });
    if (dup) throw new ApiError(409, "Another influencer already uses this Instagram username");
  }

  const data: any = {
    name: input.name,
    instagramUsername: input.instagramUsername?.replace(/^@/, "") ?? input.instagramUsername,
    instagramUrl: input.instagramUrl,
    email: input.email ? input.email.toLowerCase() : input.email,
    phone: input.phone,
    city: input.city,
    state: input.state,
    category: input.category,
    followers: input.followers,
    engagementRate: input.engagementRate,
    platform: input.platform,
    audienceLocation: input.audienceLocation,
    source: input.source,
    statusId: input.statusId,
    notes: input.notes,
    assignedToId: input.assignedToId,
    lastContactedAt: input.lastContactedAt,
    nextFollowUpAt: input.nextFollowUpAt,
    onboardingDate: input.onboardingDate,
    contentType: input.contentType,
    preferredCollaboration: input.preferredCollaboration,
    audienceDemographics: input.audienceDemographics,
    portfolio: input.portfolio,
  };
  const cleaned: any = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) cleaned[k] = v;
  }

  const updated = await prisma.influencer.update({ where: { id }, data: cleaned });

  if (input.statusId && input.statusId !== existing.statusId) {
    const newStatus = await prisma.influencerStatus.findUnique({ where: { id: input.statusId } });
    if (newStatus) {
      await appendInfluencerStatusActivity(id, newStatus.name, actor.id, existing.status.name);
      if (newStatus.name === "ONBOARDED") {
        await prisma.influencer.update({ where: { id }, data: { onboardingDate: new Date() } });
        if (updated.assignedToId && updated.assignedToId !== actor.id) {
          await createNotification({
            userId: updated.assignedToId,
            type: "ONBOARDING_COMPLETED",
            title: "Influencer onboarding completed",
            message: updated.name,
            link: `/influencers/${id}`,
          });
        }
      }
    }
  }

  await createActivity({ influencerId: id, type: "UPDATED", description: `Influencer updated: ${updated.name}`, userId: actor.id });
  await createAuditLog({ userId: actor.id, action: "UPDATE", recordType: "Influencer", recordId: id, previousValue: { ...existing }, newValue: { ...updated } });

  return updated;
}

export async function deleteInfluencer(id: string, actor: { id: string }) {
  const existing = await prisma.influencer.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Influencer not found");
  await prisma.influencer.delete({ where: { id } });
  await createAuditLog({ userId: actor.id, action: "DELETE", recordType: "Influencer", recordId: id, previousValue: { name: existing.name, email: existing.email } });
  return existing;
}

export async function appendInfluencerStatusActivity(
  influencerId: string,
  newStatusName: string,
  userId: string,
  oldStatusName?: string
) {
  if (newStatusName === "ONBOARDING") {
    await createActivity({ influencerId, type: "ONBOARDING_STARTED", description: "Onboarding started", previousValue: oldStatusName ?? null, newValue: "ONBOARDING", userId });
    return;
  }
  if (newStatusName === "ONBOARDED") {
    await createActivity({ influencerId, type: "ONBOARDING_COMPLETED", description: "Onboarding completed — available for campaign invitations", previousValue: oldStatusName ?? null, newValue: "ONBOARDED", userId });
    return;
  }
  if (oldStatusName && oldStatusName !== newStatusName) {
    await createActivity({
      influencerId,
      type: "STATUS_CHANGED",
      description: `Status changed from ${oldStatusName} to ${newStatusName}`,
      previousValue: oldStatusName,
      newValue: newStatusName,
      userId,
    });
  }
}

export async function addInfluencerNote(influencerId: string, note: string, actor: { id: string; name: string }) {
  if (!note?.trim()) throw new ApiError(422, "Note text is required");
  const influencer = await prisma.influencer.findUnique({ where: { id: influencerId } });
  if (!influencer) throw new ApiError(404, "Influencer not found");
  const noteText = note.trim();
  await prisma.influencer.update({ where: { id: influencerId }, data: { notes: noteText } });
  return createActivity({ influencerId, type: "NOTE_ADDED", description: `Note added by ${actor.name}: ${noteText}`, userId: actor.id });
}