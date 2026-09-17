import { Resend } from "resend";

import type { EmailProvider, ProviderConfig, SendEmailParams } from "./provider";

export class ResendProvider implements EmailProvider {
  id = "resend";

  private client(config: ProviderConfig) {
    if (!config.apiKey) throw new Error("Resend API key is not configured");
    return new Resend(config.apiKey);
  }

  async sendEmail(params: SendEmailParams) {
    const client = this.client({ apiKey: process.env.RESEND_API_KEY });
    const { data, error } = await client.emails.send({
      from: params.fromName
        ? `${params.fromName} <${params.fromEmail}>`
        : params.fromEmail,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
    });

    if (error) {
      return { id: "", status: "FAILED" as const, error: error.message };
    }

    return { id: data?.id ?? "", status: "SENT" as const };
  }

  async verifyConfig(config: ProviderConfig) {
    try {
      const client = this.client({ apiKey: config.apiKey ?? process.env.RESEND_API_KEY });
      const res = await client.domains.list();
      return !res.error;
    } catch {
      return false;
    }
  }
}

export const resendProvider = new ResendProvider();