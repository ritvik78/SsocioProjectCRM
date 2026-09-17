import "server-only";

import prisma from "@/lib/db";
import { ApiError } from "@/lib/auth";
import { createActivity, createAuditLog } from "@/lib/track";
import { substituteVariables } from "@/lib/email/substitute";
import { getEmailSettings, getProvider } from "@/lib/email/settings";
import type { CampaignInput } from "@/lib/validation";

export async function listCampaigns(params: { search?: string; status?: string; brandId?: string; page?: number; pageSize?: number } = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const where: any = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.brandId ? { brandId: params.brandId } : {}),
    ...(params.search
      ? { OR: [{ name: { contains: params.search, mode: "insensitive" } }, { description: { contains: params.search, mode: "insensitive" } }] }
      : {}),
  };

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: {
        brand: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { campaignInfluencers: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.campaign.count({ where }),
  ]);
  return { campaigns, total, page, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getCampaign(id: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      brand: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      campaignInfluencers: {
        include: { influencer: { select: { id: true, name: true, instagramUsername: true, email: true, followers: true, status: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
      },
      emailMessages: { include: { influencer: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  return campaign;
}

export type CampaignRecordProps = {
  name: string;
  brandId?: string | null;
  description?: string | null;
  objective?: string | null;
  status?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  budget?: string | null;
  cashbackIncentive?: string | null;
  targetInfluencers?: number | null;
  requiredContent?: string | null;
  instagramRequirements?: string | null;
  hashtags?: string | null;
  mentions?: string | null;
  termsConditions?: string | null;
};

export async function createCampaign(input: CampaignInput, actor: { id: string; name: string }) {
  const campaign = await prisma.campaign.create({
    data: {
      name: input.name,
      brandId: input.brandId,
      description: input.description,
      objective: input.objective,
      status: input.status ?? "DRAFT",
      startDate: input.startDate,
      endDate: input.endDate,
      budget: input.budget,
      cashbackIncentive: input.cashbackIncentive,
      targetInfluencers: input.targetInfluencers,
      requiredContent: input.requiredContent,
      instagramRequirements: input.instagramRequirements,
      hashtags: input.hashtags,
      mentions: input.mentions,
      termsConditions: input.termsConditions,
      createdById: actor.id,
    },
  });

  await createActivity({ campaignId: campaign.id, type: "CAMPAIGN_CREATED", description: `Campaign created: ${campaign.name}`, userId: actor.id });
  await createAuditLog({ userId: actor.id, action: "CREATE", recordType: "Campaign", recordId: campaign.id, newValue: { name: campaign.name, status: campaign.status } });
  return campaign;
}

export async function updateCampaign(id: string, input: Partial<CampaignInput>, actor: { id: string }) {
  const existing = await prisma.campaign.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Campaign not found");

  const data: any = {};
  const fields = [
    "name",
    "brandId",
    "description",
    "objective",
    "status",
    "startDate",
    "endDate",
    "budget",
    "cashbackIncentive",
    "targetInfluencers",
    "requiredContent",
    "instagramRequirements",
    "hashtags",
    "mentions",
    "termsConditions",
  ] as const;
  for (const f of fields) {
    if ((input as any)[f] !== undefined) data[f] = (input as any)[f];
  }

  const updated = await prisma.campaign.update({ where: { id }, data });
  await createActivity({ campaignId: id, type: "UPDATED", description: `Campaign updated: ${updated.name}`, userId: actor.id });
  await createAuditLog({ userId: actor.id, action: "UPDATE", recordType: "Campaign", recordId: id, newValue: { status: updated.status } });
  return updated;
}

export async function deleteCampaign(id: string, actor: { id: string }) {
  const existing = await prisma.campaign.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Campaign not found");
  await prisma.campaign.delete({ where: { id } });
  await createAuditLog({ userId: actor.id, action: "DELETE", recordType: "Campaign", recordId: id, previousValue: { name: existing.name } });
  return existing;
}

export async function addInfluencerToCampaign(campaignId: string, influencerId: string, actor: { id: string }) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new ApiError(404, "Campaign not found");

  const existing = await prisma.campaignInfluencer.findFirst({ where: { campaignId, influencerId } });
  if (existing) throw new ApiError(409, "This influencer is already in the campaign");

  const link = await prisma.campaignInfluencer.create({
    data: { campaignId, influencerId, status: "INVITED" },
  });

  const influencer = await prisma.influencer.findUnique({ where: { id: influencerId }, select: { name: true } });
  await createActivity({
    campaignId,
    influencerId,
    type: "CAMPAIGN_UPDATED",
    description: `${influencer?.name ?? "Influencer"} added to campaign ${campaign.name}`,
    userId: actor.id,
  });
  return link;
}

export async function removeInfluencerFromCampaign(campaignId: string, influencerId: string, actor: { id: string }) {
  const link = await prisma.campaignInfluencer.findFirst({ where: { campaignId, influencerId } });
  if (!link) throw new ApiError(404, "Influencer is not part of this campaign");
  await prisma.campaignInfluencer.delete({ where: { id: link.id } });
  const influencer = await prisma.influencer.findUnique({ where: { id: influencerId }, select: { name: true } });
  await createActivity({
    campaignId,
    influencerId,
    type: "CAMPAIGN_UPDATED",
    description: `${influencer?.name ?? "Influencer"} removed from campaign`,
    userId: actor.id,
  });
  return link;
}

/** Send the campaign invitation email template to all campaign influencers. */
export async function sendCampaignInvites(campaignId: string, actor: { id: string; name: string; email: string }) {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new ApiError(404, "Campaign not found");
  if (campaign.status === "DRAFT") throw new ApiError(422, "Campaign must be launched before sending invitations");

  const settings = await getEmailSettings();
  const template = await prisma.emailTemplate.findFirst({
    where: { category: "CAMPAIGN_INVITATION", status: "ACTIVE" },
  });
  if (!template) throw new ApiError(422, "No active campaign invitation draft found — create one in Drafts & Templates");

  const pending = campaign.campaignInfluencers.filter((i) => i.status !== "ACCEPTED" && i.status !== "REJECTED" && !i.invitedAt);
  if (pending.length === 0) {
    throw new ApiError(422, "No influencers pending invitation in this campaign");
  }

  const brandName = campaign.brand?.name ?? "Ssocio Pro";
  let sent = 0;
  const errors: string[] = [];

  for (const link of pending) {
    const influencer = link.influencer;
    if (!influencer.email) {
      errors.push(`${influencer.name} has no email address`);
      continue;
    }
    try {
      const ctx = {
        influencerName: influencer.name,
        brandName,
        campaignName: campaign.name,
        followers: String(influencer.followers ?? 0),
        userName: actor.name,
      };
      const subject = substituteVariables(template.subject, ctx);
      const body = substituteVariables(template.body, ctx);

      const provider = getProvider();
      const result = await provider.sendEmail({
        to: influencer.email,
        subject,
        html: body.replace(/\n/g, "<br/>"),
        fromEmail: settings?.senderEmail ?? process.env.RESEND_FROM_EMAIL ?? "Ssocio Pro <no-reply@ssociopro.com>",
        fromName: settings?.senderName ?? "Ssocio Pro",
        replyTo: settings?.replyTo,
      });

      await prisma.emailMessage.create({
        data: {
          providerMessageId: result?.id ?? null,
          recipient: influencer.email.toLowerCase(),
          senderEmail: settings?.senderEmail ?? process.env.RESEND_FROM_EMAIL ?? "no-reply@ssociopro.com",
          senderName: settings?.senderName ?? "Ssocio Pro",
          subject,
          body: body.replace(/\n/g, "<br/>"),
          deliveryStatus: result?.status === "FAILED" ? "FAILED" : "SENT",
          sentById: actor.id,
          influencerId: influencer.id,
          campaignId,
          templateId: template.id,
        },
      });
      await prisma.campaignInfluencer.update({ where: { id: link.id }, data: { status: "SENT", invitedAt: new Date() } });
      await prisma.influencer.update({ where: { id: influencer.id }, data: { lastContactedAt: new Date() } });

      await createActivity({
        influencerId: influencer.id,
        campaignId,
        type: "EMAIL_SENT",
        description: `Campaign invitation sent to ${influencer.name}`,
        userId: actor.id,
      });
      sent++;
    } catch (error: any) {
      errors.push(`${influencer.name}: ${error.message ?? "send failed"}`);
    }
  }

  await createAuditLog({
    userId: actor.id,
    action: "UPDATE",
    recordType: "Campaign",
    recordId: campaignId,
    newValue: { invitesSent: sent },
  });

  return { sent, errors, total: pending.length };
}