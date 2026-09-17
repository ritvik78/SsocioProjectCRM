import "server-only";

import prisma from "@/lib/db";
import { ApiError } from "@/lib/auth";
import { createActivity, createNotification } from "@/lib/track";
import { getEmailSettings, getProvider } from "./settings";
import { substituteVariables } from "./substitute";
import type { VariableContext } from "./substitute";

const MAX_EMAILS_PER_HOUR_PER_USER = 50;

export type EmailSendOptions = {
  recipient: string;
  subject: string;
  body: string;
  templateId?: string | null;
  brandId?: string | null;
  influencerId?: string | null;
  campaignId?: string | null;
  followUpDate?: Date | null;
  createFollowUp?: boolean;
  actorId: string;
  actorName: string;
  actorEmail: string;
};

async function buildVariableContext(opts: EmailSendOptions): Promise<VariableContext> {
  const ctx: VariableContext = {
    sender_name: opts.actorName,
    sender_email: opts.actorEmail,
  };

  if (opts.brandId) {
    const brand = await prisma.brand.findUnique({ where: { id: opts.brandId } });
    if (brand) {
      ctx.company_name = brand.companyName || brand.name;
      ctx.brand_name = brand.name;
      ctx.contact_name = brand.contactName || "";
      ctx.instagram_username = brand.instagramHandle || "";
      ctx.city = brand.city || "";
    }
  }

  if (opts.influencerId) {
    const influencer = await prisma.influencer.findUnique({ where: { id: opts.influencerId } });
    if (influencer) {
      ctx.influencer_name = influencer.name;
      ctx.instagram_username = influencer.instagramUsername || "";
      ctx.category = influencer.category || "";
      ctx.city = influencer.city || "";
    }
  }

  if (opts.campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: opts.campaignId },
      include: { brand: true },
    });
    if (campaign) {
      ctx.campaign_name = campaign.name;
      if (!ctx.brand_name) ctx.brand_name = campaign.brand.name;
      if (!ctx.company_name) ctx.company_name = campaign.brand.companyName || campaign.brand.name;
    }
  }

  return ctx;
}

async function enforceRateLimit(userId: string) {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.emailMessage.count({
    where: { sentById: userId, createdAt: { gte: since } },
  });
  if (count >= MAX_EMAILS_PER_HOUR_PER_USER) {
    throw new ApiError(429, `Rate limit reached: ${MAX_EMAILS_PER_HOUR_PER_USER} emails per hour. Try again later.`);
  }
}

export async function sendEmail(opts: EmailSendOptions) {
  const settings = await getEmailSettings();
  if (!settings || !settings.senderEmail || !settings.apiKeyConfigured) {
    throw new ApiError(400, "Email provider is not configured. Ask an administrator to configure email settings.");
  }

  if (!opts.recipient || !opts.recipient.includes("@")) {
    throw new ApiError(422, "A valid recipient email is required");
  }

  await enforceRateLimit(opts.actorId);

  const ctx = await buildVariableContext(opts);
  const subject = substituteVariables(opts.subject, ctx);
  const htmlBody = substituteVariables(opts.body, ctx).replace(/\n/g, "<br/>");

  // Persist the outgoing message up-front so history is never lost.
  const message = await prisma.emailMessage.create({
    data: {
      recipient: opts.recipient.toLowerCase(),
      senderEmail: settings.senderEmail,
      senderName: settings.senderName,
      subject,
      body: htmlBody,
      templateId: opts.templateId ?? null,
      brandId: opts.brandId ?? null,
      influencerId: opts.influencerId ?? null,
      campaignId: opts.campaignId ?? null,
      sentById: opts.actorId,
      deliveryStatus: "SENDING",
      followUpDate: opts.followUpDate ?? null,
    },
  });

  try {
    const provider = getProvider();
    const result = await provider.sendEmail({
      to: opts.recipient.toLowerCase(),
      subject,
      html: htmlBody,
      fromEmail: settings.senderEmail,
      fromName: settings.senderName,
      replyTo: settings.replyTo,
    });

    if (result.status === "FAILED") {
      await prisma.emailMessage.update({
        where: { id: message.id },
        data: { deliveryStatus: "FAILED" },
      });
      await prisma.emailEvent.create({
        data: { emailId: message.id, eventType: "failed", raw: { error: result.error } },
      });
      throw new ApiError(502, result.error || "Email provider failed to send");
    }

    await prisma.emailMessage.update({
      where: { id: message.id },
      data: { deliveryStatus: "SENT", providerMessageId: result.id || null },
    });
    await prisma.emailEvent.create({ data: { emailId: message.id, eventType: "sent" } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 502) {
      await prisma.emailEvent.create({ data: { emailId: message.id, eventType: "failed", raw: { error: (error as Error).message } } });
    }
    throw error;
  }

  // ---------- Automations ----------
  const descriptionParts = [`Email sent to ${opts.recipient}`];
  if (subject) descriptionParts.push(`Subject: ${subject}`);
  await createActivity({
    brandId: opts.brandId,
    influencerId: opts.influencerId,
    campaignId: opts.campaignId,
    type: "EMAIL_SENT",
    description: descriptionParts.join(" — "),
    meta: { recipient: opts.recipient, subject, emailId: message.id },
    userId: opts.actorId,
  });

  // Touch last-contacted on the related records.
  if (opts.brandId) {
    await prisma.brand.update({ where: { id: opts.brandId }, data: { lastContactedAt: new Date() } });
    const brand = await prisma.brand.findUnique({ where: { id: opts.brandId } });
    if (brand?.leadOwnerId && brand.leadOwnerId !== opts.actorId) {
      await createNotification({
        userId: brand.leadOwnerId,
        type: "EMAIL_FOLLOWUP",
        title: "Email sent to brand",
        message: `${opts.actorName} emailed ${brand.name}`,
        link: `/brands/${brand.id}`,
      });
    }
  }
  if (opts.influencerId) {
    await prisma.influencer.update({ where: { id: opts.influencerId }, data: { lastContactedAt: new Date() } });
  }

  // Optionally create the follow-up record.
  if (opts.createFollowUp && opts.followUpDate) {
    await prisma.followup.create({
      data: {
        brandId: opts.brandId ?? null,
        influencerId: opts.influencerId ?? null,
        dueDate: opts.followUpDate,
        status: "PENDING",
        priority: "MEDIUM",
        assignedToId: opts.actorId,
        notes: `Follow-up for: ${subject}`,
      },
    });
    await createActivity({
      brandId: opts.brandId,
      influencerId: opts.influencerId,
      type: "FOLLOW_UP_CREATED",
      description: `Follow-up created for ${new Date(opts.followUpDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
      userId: opts.actorId,
    });
  }

  return message;
}

export async function getEmailMessageWithDetails(id: string) {
  return prisma.emailMessage.findUnique({
    where: { id },
    include: {
      template: true,
      brand: true,
      influencer: true,
      campaign: true,
      sentBy: true,
      events: { orderBy: { createdAt: "desc" } },
    },
  });
}