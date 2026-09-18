import { NextResponse, type NextRequest } from "next/server";
import { apiRequirePermission } from "@/lib/auth";
import { sendEmail } from "@/lib/email/send";
import { sendEmailSchema } from "@/lib/validation";
import prisma from "@/lib/db";
import { getDefaultBrandStatus } from "@/lib/records/brands";
import { getDefaultInfluencerStatus } from "@/lib/records/influencers";
import { createActivity } from "@/lib/track";

export async function POST(req: NextRequest) {
  try {
    const ctx = await apiRequirePermission("emails.send");
    const body = await req.json().catch(() => ({}));
    const parsed = sendEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please fix the form errors" }, { status: 422 });
    }

    let brandId = parsed.data.brandId ?? null;
    let influencerId = parsed.data.influencerId ?? null;
    let recipient = parsed.data.recipient?.trim().toLowerCase() ?? "";

    let newBrandName = parsed.data.newBrandName ?? null;
    let newInfluencerName = parsed.data.newInfluencerName ?? null;

    if (brandId) {
      const exists = await prisma.brand.findUnique({ where: { id: brandId }, select: { id: true } });
      if (!exists) {
        if (!newBrandName) newBrandName = brandId;
        brandId = null;
      }
    }

    if (influencerId) {
      const exists = await prisma.influencer.findUnique({ where: { id: influencerId }, select: { id: true } });
      if (!exists) {
        if (!newInfluencerName) newInfluencerName = influencerId;
        influencerId = null;
      }
    }

    // Optional "Add to CRM": create a new brand/influencer lead from the email.
    if (!brandId && newBrandName) {
      const status = await getDefaultBrandStatus();
      const brand = await prisma.brand.create({
        data: { name: newBrandName, email: recipient || null, statusId: status?.id ?? "", leadOwnerId: ctx.user.id },
      });
      brandId = brand.id;
      await createActivity({ brandId: brand.id, type: "LEAD_CREATED", description: `Brand created from quick email: ${brand.name}`, userId: ctx.user.id });
    }
    if (!influencerId && newInfluencerName) {
      const status = await getDefaultInfluencerStatus();
      const influencer = await prisma.influencer.create({
        data: { name: newInfluencerName, email: recipient || null, statusId: status?.id ?? "", assignedToId: ctx.user.id },
      });
      influencerId = influencer.id;
      await createActivity({ influencerId: influencer.id, type: "LEAD_CREATED", description: `Influencer created from quick email: ${influencer.name}`, userId: ctx.user.id });
    }

    // Auto-fill the recipient from a linked entity when not explicitly provided.
    if (!recipient) {
      if (brandId) {
        const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { email: true } });
        recipient = brand?.email ?? "";
      } else if (influencerId) {
        const influencer = await prisma.influencer.findUnique({ where: { id: influencerId }, select: { email: true } });
        recipient = influencer?.email ?? "";
      }
    }

    if (!recipient) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 422 });
    }

    const message = await sendEmail({
      recipient,
      subject: parsed.data.subject,
      body: parsed.data.body,
      templateId: parsed.data.templateId,
      brandId,
      influencerId,
      campaignId: parsed.data.campaignId,
      followUpDate: parsed.data.followUpDate,
      createFollowUp: parsed.data.createFollowUp,
      actorId: ctx.user.id,
      actorName: ctx.user.name,
      actorEmail: ctx.user.email,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Failed to send email" }, { status: error.status ?? 500 });
  }
}