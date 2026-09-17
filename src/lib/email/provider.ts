export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
};

export type SendEmailResult = {
  id: string; // provider message id
  status: "SENT" | "FAILED";
  error?: string;
};

export type ProviderConfig = {
  apiKey?: string;
};

export interface EmailProvider {
  id: string;
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
  verifyConfig(config: ProviderConfig): Promise<boolean>;
}