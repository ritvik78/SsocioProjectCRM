import { z } from "zod";

const optionalString = z.string().trim().optional().nullable();
const optionalEmail = z
  .string()
  .trim()
  .email("Enter a valid email address")
  .optional()
  .nullable()
  .or(z.literal(""));
const optionalDate = z
  .string()
  .optional()
  .nullable()
  .transform((v) => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  });
const optionalNumber = z.coerce.number().optional().nullable();

export const brandSchema = z.object({
  name: z.string().trim().min(1, "Brand name is required"),
  companyName: optionalString,
  contactName: optionalString,
  designation: optionalString,
  email: optionalEmail,
  phone: optionalString,
  website: optionalString,
  instagramHandle: optionalString,
  linkedin: optionalString,
  industry: optionalString,
  city: optionalString,
  state: optionalString,
  source: optionalString,
  statusId: z.string().min(1, "Status is required"),
  priority: z.string().default("MEDIUM"),
  notes: optionalString,
  leadOwnerId: optionalString,
  lastContactedAt: optionalDate,
  nextFollowUpAt: optionalDate,
  onboardingDate: optionalDate,
  campaignStatus: optionalString,
  businessCategory: optionalString,
  location: optionalString,
  gstNumber: optionalString,
  description: optionalString,
  productsServices: optionalString,
  collaborationType: optionalString,
  expectedCampaignType: optionalString,
  budget: optionalString,
});

export const influencerSchema = z.object({
  name: z.string().trim().min(1, "Influencer name is required"),
  instagramUsername: optionalString,
  instagramUrl: optionalString,
  email: optionalEmail,
  phone: optionalString,
  city: optionalString,
  state: optionalString,
  category: optionalString,
  followers: optionalNumber,
  engagementRate: optionalNumber,
  platform: z.string().default("INSTAGRAM"),
  audienceLocation: optionalString,
  source: optionalString,
  statusId: z.string().min(1, "Status is required"),
  notes: optionalString,
  assignedToId: optionalString,
  lastContactedAt: optionalDate,
  nextFollowUpAt: optionalDate,
  onboardingDate: optionalDate,
  contentType: optionalString,
  preferredCollaboration: optionalString,
  audienceDemographics: optionalString,
  portfolio: optionalString,
});

export const campaignSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required"),
  brandId: z.string().min(1, "Brand is required"),
  description: optionalString,
  objective: optionalString,
  startDate: optionalDate,
  endDate: optionalDate,
  budget: optionalString,
  cashbackIncentive: optionalString,
  targetInfluencers: optionalNumber,
  requiredContent: optionalString,
  instagramRequirements: optionalString,
  hashtags: optionalString,
  mentions: optionalString,
  termsConditions: optionalString,
  status: z.string().default("DRAFT"),
});

export const emailTemplateSchema = z.object({
  name: z.string().trim().min(1, "Draft name is required"),
  category: z.string().min(1, "Category is required"),
  subject: z.string().trim().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  variables: z.array(z.string()).optional().default([]),
  status: z.string().default("ACTIVE"),
});

export const sendEmailSchema = z.object({
  recipient: z.string().email("Enter a valid email address").optional().nullable(),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  templateId: optionalString,
  brandId: optionalString,
  influencerId: optionalString,
  campaignId: optionalString,
  newBrandName: optionalString,
  newInfluencerName: optionalString,
  followUpDate: optionalDate,
  createFollowUp: z.boolean().optional(),
});

export const followupSchema = z.object({
  brandId: optionalString,
  influencerId: optionalString,
  contactType: z.string().default("EMAIL"),
  dueDate: z.string().min(1, "Follow-up date is required").transform((v) => new Date(v)),
  priority: z.string().default("MEDIUM"),
  notes: optionalString,
  assignedToId: optionalString,
});

export const responseSchema = z.object({
  brandId: optionalString,
  influencerId: optionalString,
  type: z.string().min(1, "Response type is required"),
  text: optionalString,
  date: optionalDate,
  channel: optionalString,
  notes: optionalString,
});

export const instagramOutreachSchema = z.object({
  influencerId: optionalString,
  instagramUsername: z.string().min(1, "Instagram username is required"),
  instagramUrl: optionalString,
  outreachDate: optionalDate,
  message: optionalString,
  outreachType: z.string().default("DM"),
  assignedToId: optionalString,
  response: optionalString,
  responseDate: optionalDate,
  followUpDate: optionalDate,
  status: z.string().default("MESSAGE_SENT"),
  notes: optionalString,
});

export const campaignInviteSchema = z.object({
  influencerIds: z.array(z.string()).min(1, "Select at least one influencer"),
});

export const teamInviteSchema = z.object({
  name: z.string().trim().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: optionalString,
  designation: optionalString,
  role: z.string().min(1, "Role is required"),
  permissions: z.array(z.string()).optional().default([]),
});

export const setupSchema = z.object({
  name: z.string().trim().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const emailSettingsSchema = z.object({
  provider: z.string().default("resend"),
  apiKey: z.string().optional(),
  senderEmail: z.string().email("Enter a valid sender email"),
  senderName: z.string().min(1, "Sender name is required"),
  replyTo: z.string().email("Enter a valid reply-to email").optional().nullable(),
});

export type BrandInput = z.infer<typeof brandSchema>;
export type InfluencerInput = z.infer<typeof influencerSchema>;
export type CampaignInput = z.infer<typeof campaignSchema>;
export type EmailTemplateInput = z.infer<typeof emailTemplateSchema>;
export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type FollowupInput = z.infer<typeof followupSchema>;
export type ResponseInput = z.infer<typeof responseSchema>;
export type InstagramOutreachInput = z.infer<typeof instagramOutreachSchema>;
export type TeamInviteInput = z.infer<typeof teamInviteSchema>;