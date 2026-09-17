export const ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_MEMBER"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  TEAM_MEMBER: "Team Member",
};

export const PERMISSION_DEFS = [
  { key: "brands.view", name: "View Brands", group: "Brands" },
  { key: "brands.add", name: "Add Brands", group: "Brands" },
  { key: "brands.edit", name: "Edit Brands", group: "Brands" },
  { key: "brands.delete", name: "Delete Brands", group: "Brands" },
  { key: "influencers.view", name: "View Influencers", group: "Influencers" },
  { key: "influencers.add", name: "Add Influencers", group: "Influencers" },
  { key: "influencers.edit", name: "Edit Influencers", group: "Influencers" },
  { key: "influencers.delete", name: "Delete Influencers", group: "Influencers" },
  { key: "emails.send", name: "Send Emails", group: "Outreach" },
  { key: "outreach.manage", name: "Manage Outreach", group: "Outreach" },
  { key: "responses.manage", name: "Manage Responses", group: "Outreach" },
  { key: "drafts.manage", name: "Manage Drafts", group: "Content" },
  { key: "campaigns.manage", name: "Manage Campaigns", group: "Campaigns" },
  { key: "followups.manage", name: "Manage Follow-ups", group: "Follow-ups" },
  { key: "analytics.view", name: "View Analytics", group: "Insights" },
  { key: "team.manage", name: "Manage Team", group: "Administration" },
  { key: "permissions.manage", name: "Manage Permissions", group: "Administration" },
] as const;

export const ALL_PERMISSIONS = PERMISSION_DEFS.map((p) => p.key);
export type PermissionKey = (typeof PERMISSION_DEFS)[number]["key"];

export const ROLE_DEFAULT_PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN: [...ALL_PERMISSIONS],
  ADMIN: ALL_PERMISSIONS.filter(
    (k) => k !== "team.manage" && k !== "permissions.manage"
  ),
  MANAGER: [
    "brands.view",
    "brands.add",
    "brands.edit",
    "influencers.view",
    "influencers.add",
    "influencers.edit",
    "emails.send",
    "outreach.manage",
    "responses.manage",
    "drafts.manage",
    "campaigns.manage",
    "followups.manage",
    "analytics.view",
  ],
  TEAM_MEMBER: [
    "brands.view",
    "brands.add",
    "brands.edit",
    "influencers.view",
    "influencers.add",
    "influencers.edit",
    "emails.send",
    "outreach.manage",
    "responses.manage",
    "followups.manage",
  ],
};

export const BRAND_STATUSES = [
  { name: "NEW LEAD", color: "#3b82f6", order: 1 },
  { name: "CONTACTED", color: "#6366f1", order: 2 },
  { name: "EMAIL SENT", color: "#8b5cf6", order: 3 },
  { name: "FOLLOW-UP", color: "#a855f7", order: 4 },
  { name: "RESPONSE RECEIVED", color: "#06b6d4", order: 5 },
  { name: "INTERESTED", color: "#10b981", order: 6 },
  { name: "NEGOTIATION", color: "#f59e0b", order: 7 },
  { name: "ONBOARDING", color: "#ec4899", order: 8 },
  { name: "ONBOARDED", color: "#22c55e", order: 9 },
  { name: "CAMPAIGN ACTIVE", color: "#14b8a6", order: 10 },
  { name: "NOT INTERESTED", color: "#ef4444", order: 11 },
  { name: "CLOSED", color: "#6b7280", order: 12 },
  { name: "LOST", color: "#991b1b", order: 13 },
];

export const INFLUENCER_STATUSES = [
  { name: "NEW", color: "#3b82f6", order: 1 },
  { name: "CONTACTED", color: "#6366f1", order: 2 },
  { name: "INSTAGRAM OUTREACH", color: "#e1306c", order: 3 },
  { name: "EMAIL OUTREACH", color: "#8b5cf6", order: 4 },
  { name: "FOLLOW-UP", color: "#a855f7", order: 5 },
  { name: "RESPONSE RECEIVED", color: "#06b6d4", order: 6 },
  { name: "INTERESTED", color: "#10b981", order: 7 },
  { name: "NEGOTIATION", color: "#f59e0b", order: 8 },
  { name: "ONBOARDING", color: "#ec4899", order: 9 },
  { name: "ONBOARDED", color: "#22c55e", order: 10 },
  { name: "CAMPAIGN ACTIVE", color: "#14b8a6", order: 11 },
  { name: "NOT INTERESTED", color: "#ef4444", order: 12 },
  { name: "NO RESPONSE", color: "#f97316", order: 13 },
  { name: "CLOSED", color: "#6b7280", order: 14 },
];

export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "UPCOMING",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
] as const;

export const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  DRAFT: "#6b7280",
  UPCOMING: "#3b82f6",
  ACTIVE: "#22c55e",
  PAUSED: "#f59e0b",
  COMPLETED: "#8b5cf6",
  CANCELLED: "#ef4444",
};

export const EMAIL_CATEGORIES = [
  { value: "BRAND_OUTREACH", label: "Brand Outreach" },
  { value: "INFLUENCER_OUTREACH", label: "Influencer Outreach" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "BRAND_ONBOARDING", label: "Brand Onboarding" },
  { value: "INFLUENCER_ONBOARDING", label: "Influencer Onboarding" },
  { value: "CAMPAIGN_INVITATION", label: "Campaign Invitation" },
  { value: "GENERAL_BUSINESS", label: "General Business" },
] as const;

export const EMAIL_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  EMAIL_CATEGORIES.map((c) => [c.value, c.label])
);

export const TEMPLATE_VARIABLES = [
  { key: "brand_name", label: "Brand Name" },
  { key: "company_name", label: "Company Name" },
  { key: "contact_name", label: "Contact Name" },
  { key: "influencer_name", label: "Influencer Name" },
  { key: "instagram_username", label: "Instagram Username" },
  { key: "campaign_name", label: "Campaign Name" },
  { key: "category", label: "Influencer Category" },
  { key: "city", label: "City" },
  { key: "sender_name", label: "Sender Name" },
  { key: "sender_email", label: "Sender Email" },
];

export const RESPONSE_TYPES = [
  { value: "INTERESTED", label: "Interested", color: "#10b981" },
  { value: "NOT_INTERESTED", label: "Not Interested", color: "#ef4444" },
  { value: "NEED_MORE_INFORMATION", label: "Need More Information", color: "#f59e0b" },
  { value: "NEGOTIATION", label: "Negotiation", color: "#8b5cf6" },
  { value: "CALLBACK_REQUESTED", label: "Callback Requested", color: "#3b82f6" },
  { value: "NO_RESPONSE", label: "No Response", color: "#f97316" },
  { value: "OTHER", label: "Other", color: "#6b7280" },
] as const;

export const RESPONSE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  RESPONSE_TYPES.map((r) => [r.value, r.label])
);

export const FOLLOWUP_STATUSES = ["PENDING", "COMPLETED", "RESCHEDULED", "CANCELLED"] as const;
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#6b7280",
  MEDIUM: "#3b82f6",
  HIGH: "#f59e0b",
  URGENT: "#ef4444",
};

export const IG_OUTREACH_STATUSES = [
  "NOT_CONTACTED",
  "MESSAGE_SENT",
  "FOLLOW_UP",
  "REPLIED",
  "INTERESTED",
  "NOT_INTERESTED",
  "NO_RESPONSE",
  "ONBOARDED",
] as const;

export const IG_STATUS_COLORS: Record<string, string> = {
  NOT_CONTACTED: "#6b7280",
  MESSAGE_SENT: "#3b82f6",
  FOLLOW_UP: "#f59e0b",
  REPLIED: "#06b6d4",
  INTERESTED: "#10b981",
  NOT_INTERESTED: "#ef4444",
  NO_RESPONSE: "#f97316",
  ONBOARDED: "#22c55e",
};

export const ACTIVITY_TYPES = {
  LEAD_CREATED: "Lead Created",
  EMAIL_SENT: "Email Sent",
  EMAIL_RECEIVED: "Email Received",
  INSTAGRAM_OUTREACH: "Instagram Outreach",
  FOLLOW_UP_CREATED: "Follow-up Created",
  FOLLOW_UP_COMPLETED: "Follow-up Completed",
  RESPONSE_ADDED: "Response Added",
  STATUS_CHANGED: "Status Changed",
  NOTE_ADDED: "Note Added",
  ONBOARDING_STARTED: "Onboarding Started",
  ONBOARDING_COMPLETED: "Onboarding Completed",
  CAMPAIGN_CREATED: "Campaign Created",
  CAMPAIGN_INVITATION: "Campaign Invitation",
  CAMPAIGN_ACCEPTED: "Campaign Accepted",
  CAMPAIGN_REJECTED: "Campaign Rejected",
  UPDATED: "Updated",
  DELETED: "Deleted",
} as const;

export const CONTACT_TYPES = ["EMAIL", "INSTAGRAM", "PHONE", "WHATSAPP", "OTHER"] as const;

export const INDUSTRIES = [
  "Fashion",
  "Beauty",
  "Fitness",
  "Food & Beverage",
  "Technology",
  "Travel",
  "Home & Decor",
  "Health & Wellness",
  "Education",
  "Finance",
  "Automotive",
  "Entertainment",
  "E-commerce",
  "Other",
];

export const LEAD_SOURCES = [
  "Referral",
  "Instagram",
  "LinkedIn",
  "Website",
  "Cold Outreach",
  "Event",
  "Import",
  "Other",
];

export const INFLUENCER_CATEGORIES = [
  "Fashion",
  "Beauty",
  "Fitness",
  "Food",
  "Travel",
  "Tech",
  "Lifestyle",
  "Gaming",
  "Comedy",
  "Education",
  "Business",
  "Parenting",
  "Other",
];

export const STORAGE_KEYS = {
  emailSettings: "email.provider",
} as const;
