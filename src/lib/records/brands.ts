import "server-only";

import prisma from "@/lib/db";
import { ApiError } from "@/lib/auth";
import { createActivity, createAuditLog, createNotification } from "@/lib/track";
import type { BrandInput } from "@/lib/validation";

export async function getDefaultBrandStatus() {
  return prisma.brandStatus.findFirst({ where: { name: "NEW LEAD" } });
}

export async function getStatusByNames(names: string[]) {
  return prisma.brandStatus.findMany({ where: { name: { in: names } } });
}

export type BrandListParams = {
  search?: string;
  statusId?: string;
  ownerId?: string;
  priority?: string;
  industry?: string;
  source?: string;
  campaignStatus?: string;
  city?: string;
  onboardedOnly?: boolean;
  contactable?: boolean;
  createdFrom?: string;
  createdTo?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
};

export async function listBrands(params: BrandListParams = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));

  const where: any = {};

  if (params.search) {
    const q = params.search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
      { contactName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { instagramHandle: { contains: q, mode: "insensitive" } },
      { website: { contains: q, mode: "insensitive" } },
    ];
  }
  if (params.statusId) where.statusId = params.statusId;
  if (params.ownerId) where.leadOwnerId = params.ownerId;
  if (params.priority) where.priority = params.priority;
  if (params.industry) where.industry = params.industry;
  if (params.source) where.source = params.source;
  if (params.campaignStatus) where.campaignStatus = params.campaignStatus;
  if (params.city) where.city = { contains: params.city, mode: "insensitive" };
  if (params.onboardedOnly) {
    where.status = { is: { name: "ONBOARDED" } };
  }
  if (params.contactable) {
    where.OR = [{ email: { not: null } }, { phone: { not: null } }];
  }
  if (params.createdFrom || params.createdTo) {
    where.createdAt = {};
    if (params.createdFrom) where.createdAt.gte = new Date(params.createdFrom);
    if (params.createdTo) where.createdAt.lte = new Date(params.createdTo);
  }

  const orderBy: any =
    params.sort === "name"
      ? [{ name: "asc" as const }]
      : params.sort === "last_contacted"
        ? [{ lastContactedAt: "desc" as const }]
        : params.sort === "next_followup"
          ? [{ nextFollowUpAt: "asc" as const }]
          : [{ createdAt: "desc" as const }];

  const [brands, total] = await Promise.all([
    prisma.brand.findMany({
      where,
      include: {
        status: true,
        leadOwner: { select: { id: true, name: true, email: true } },
        _count: { select: { followups: { where: { status: "PENDING" } }, campaigns: true, activities: true } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.brand.count({ where }),
  ]);

  return { brands, total, page, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getBrand(id: string) {
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      status: true,
      leadOwner: { select: { id: true, name: true, email: true } },
      campaigns: { orderBy: { createdAt: "desc" } },
      emailMessages: { orderBy: { createdAt: "desc" }, take: 50 },
      responses: { orderBy: { date: "desc" } },
      followups: { orderBy: { dueDate: "asc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });
  if (!brand) return null;
  return brand;
}

export async function createBrand(input: BrandInput, actor: { id: string; name: string }) {
  const exists = input.email
    ? await prisma.brand.findFirst({ where: { email: { equals: input.email.toLowerCase(), mode: "insensitive" } } })
    : null;
  if (exists) {
    throw new ApiError(409, "A brand with this email already exists");
  }

  const status = await prisma.brandStatus.findUnique({ where: { id: input.statusId } });
  if (!status) throw new ApiError(422, "Invalid brand status");

  const brand = await prisma.brand.create({
    data: {
      name: input.name,
      companyName: input.companyName,
      contactName: input.contactName,
      designation: input.designation,
      email: input.email ? input.email.toLowerCase() : null,
      phone: input.phone,
      website: input.website,
      instagramHandle: input.instagramHandle,
      linkedin: input.linkedin,
      industry: input.industry,
      city: input.city,
      state: input.state,
      source: input.source,
      statusId: input.statusId,
      priority: input.priority,
      notes: input.notes,
      leadOwnerId: input.leadOwnerId,
      lastContactedAt: input.lastContactedAt,
      nextFollowUpAt: input.nextFollowUpAt,
      onboardingDate: input.onboardingDate,
      campaignStatus: input.campaignStatus,
      businessCategory: input.businessCategory,
      location: input.location,
      gstNumber: input.gstNumber,
      description: input.description,
      productsServices: input.productsServices,
      collaborationType: input.collaborationType,
      expectedCampaignType: input.expectedCampaignType,
      budget: input.budget,
    },
  });

  await createActivity({
    brandId: brand.id,
    type: "LEAD_CREATED",
    description: `Brand created: ${brand.name}${input.source ? ` (source: ${input.source})` : ""}`,
    meta: { status: status.name },
    userId: actor.id,
  });
  await appendStatusActivity(brand.id, status.name, actor.id);
  await createAuditLog({
    userId: actor.id,
    action: "CREATE",
    recordType: "Brand",
    recordId: brand.id,
    newValue: { ...brand },
  });
  await maybeNotifyOwner(brand.id, brand.leadOwnerId, actor.id);

  return brand;
}

export async function updateBrand(
  id: string,
  input: Partial<BrandInput>,
  actor: { id: string; name: string }
) {
  const existing = await prisma.brand.findUnique({ where: { id }, include: { status: true } });
  if (!existing) throw new ApiError(404, "Brand not found");

  if (input.email) {
    const dup = await prisma.brand.findFirst({
      where: { email: { equals: input.email.toLowerCase(), mode: "insensitive" }, id: { not: id } },
    });
    if (dup) throw new ApiError(409, "Another brand already uses this email");
  }

  const data: any = {
    name: input.name,
    companyName: input.companyName,
    contactName: input.contactName,
    designation: input.designation,
    email: input.email ? input.email.toLowerCase() : input.email,
    phone: input.phone,
    website: input.website,
    instagramHandle: input.instagramHandle,
    linkedin: input.linkedin,
    industry: input.industry,
    city: input.city,
    state: input.state,
    source: input.source,
    statusId: input.statusId,
    priority: input.priority,
    notes: input.notes,
    leadOwnerId: input.leadOwnerId,
    lastContactedAt: input.lastContactedAt,
    nextFollowUpAt: input.nextFollowUpAt,
    onboardingDate: input.onboardingDate,
    campaignStatus: input.campaignStatus,
    businessCategory: input.businessCategory,
    location: input.location,
    gstNumber: input.gstNumber,
    description: input.description,
    productsServices: input.productsServices,
    collaborationType: input.collaborationType,
    expectedCampaignType: input.expectedCampaignType,
    budget: input.budget,
  };
  // Prisma ignores undefined keys; filter them so partial patches don't null fields.
  const cleaned: any = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) cleaned[k] = v;
  }

  const updated = await prisma.brand.update({ where: { id }, data: cleaned });

  await createActivity({
    brandId: id,
    type: "UPDATED",
    description: `Brand updated: ${updated.name}`,
    userId: actor.id,
  });

  if (input.statusId && input.statusId !== existing.statusId) {
    const newStatus = await prisma.brandStatus.findUnique({ where: { id: input.statusId } });
    if (newStatus) {
      await appendStatusActivity(id, newStatus.name, actor.id, existing.status.name, {
        previous: existing.status.name,
        new: newStatus.name,
      });
      await maybeApplyBrandAutomations(id, updated.leadOwnerId, newStatus.name, actor.id);
    }
  }

  await createAuditLog({
    userId: actor.id,
    action: "UPDATE",
    recordType: "Brand",
    recordId: id,
    previousValue: { ...existing },
    newValue: { ...updated },
  });
  await maybeNotifyOwner(id, updated.leadOwnerId, actor.id);

  return updated;
}

export async function deleteBrand(id: string, actor: { id: string }) {
  const existing = await prisma.brand.findUnique({ where: { id }, include: { campaigns: true } });
  if (!existing) throw new ApiError(404, "Brand not found");
  if (existing.campaigns.length > 0) {
    throw new ApiError(400, "This brand has campaigns. Delete the campaigns first.");
  }
  await prisma.brand.delete({ where: { id } });
  await createAuditLog({
    userId: actor.id,
    action: "DELETE",
    recordType: "Brand",
    recordId: id,
    previousValue: { name: existing.name, email: existing.email },
  });
  return existing;
}

export async function appendStatusActivity(
  brandId: string,
  newStatusName: string,
  userId: string,
  oldStatusName?: string,
  detail?: { previous: string; new: string }
) {
  if (newStatusName === "ONBOARDING") {
    await createActivity({
      brandId,
      type: "ONBOARDING_STARTED",
      description: "Onboarding started",
      previousValue: oldStatusName ?? null,
      newValue: "ONBOARDING",
      userId,
    });
    return;
  }
  if (newStatusName === "ONBOARDED") {
    await createActivity({
      brandId,
      type: "ONBOARDING_COMPLETED",
      description: "Onboarding completed — brand is available for campaigns",
      previousValue: oldStatusName ?? null,
      newValue: "ONBOARDED",
      userId,
    });
    return;
  }
  if (detail) {
    await createActivity({
      brandId,
      type: "STATUS_CHANGED",
      description: `Status changed from ${detail.previous} to ${detail.new}`,
      previousValue: detail.previous,
      newValue: detail.new,
      userId,
    });
  }
}

export async function maybeApplyBrandAutomations(
  brandId: string,
  ownerId: string | null,
  newStatusName: string,
  actorId: string
) {
  if (newStatusName === "ONBOARDED") {
    const brand = await prisma.brand.update({
      where: { id: brandId },
      data: { onboardingDate: new Date(), campaignStatus: "NONE" },
    });
    if (ownerId && ownerId !== actorId) {
      await createNotification({
        userId: ownerId,
        type: "ONBOARDING_COMPLETED",
        title: "Brand onboarding completed",
        message: `${brand.name} is now onboarded and available for campaigns`,
        link: `/brands/${brandId}`,
      });
    }
  }
}

export async function maybeNotifyOwner(brandId: string, ownerId: string | null, actorId: string) {
  if (ownerId && ownerId !== actorId) {
    const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { name: true } });
    if (brand) {
      await createNotification({
        userId: ownerId,
        type: "NEW_LEAD",
        title: "New brand assigned",
        message: brand.name,
        link: `/brands/${brandId}`,
      });
    }
  }
}

/** Adds a note through the activity timeline. */
export async function addBrandNote(brandId: string, note: string, actor: { id: string; name: string }) {
  if (!note || !note.trim()) throw new ApiError(422, "Note text is required");
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) throw new ApiError(404, "Brand not found");
  const noteText = note.trim();
  await prisma.brand.update({ where: { id: brandId }, data: { notes: noteText } });
  return createActivity({
    brandId,
    type: "NOTE_ADDED",
    description: `Note added by ${actor.name}: ${noteText}`,
    userId: actor.id,
  });
}