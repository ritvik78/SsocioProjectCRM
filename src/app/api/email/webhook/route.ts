import { NextResponse } from "next/server";
import prisma from "@/lib/db";

/**
 * Provider webhook (Resend). Receives delivery / open / click events for sent
 * emails and updates the stored EmailMessage + EmailEvent records.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const type: string | undefined = body?.type;
  const data = body?.data ?? body;

  const providerId =
    data?.email_id ?? data?.message_id ?? data?.messageId ?? data?.id;
  if (!type || !providerId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const message = await prisma.emailMessage.findFirst({
    where: { providerMessageId: String(providerId) },
  });
  if (!message) {
    return NextResponse.json({ ok: false, error: "Email not found" }, { status: 404 });
  }

  const eventTypeMap: Record<string, string> = {
    "email.delivered": "delivered",
    "email.sent": "delivered",
    "email.opened": "opened",
    "email.clicked": "clicked",
    "email.bounced": "bounced",
    "email.complained": "bounced",
    "email.failed": "failed",
  };

  const mapped = eventTypeMap[type] ?? type;

  switch (mapped) {
    case "delivered":
      await prisma.emailMessage.update({ where: { id: message.id }, data: { deliveryStatus: "DELIVERED" } });
      break;
    case "opened":
      await prisma.emailMessage.update({ where: { id: message.id }, data: { openStatus: true } });
      break;
    case "clicked":
      await prisma.emailMessage.update({ where: { id: message.id }, data: { clickStatus: true } });
      break;
    case "bounced":
      await prisma.emailMessage.update({ where: { id: message.id }, data: { deliveryStatus: "BOUNCED", responseStatus: "BOUNCED" } });
      break;
    case "failed":
      await prisma.emailMessage.update({ where: { id: message.id }, data: { deliveryStatus: "FAILED" } });
      break;
  }

  await prisma.emailEvent.create({
    data: {
      emailId: message.id,
      eventType: mapped,
      raw: body,
    },
  });

  return NextResponse.json({ ok: true });
}