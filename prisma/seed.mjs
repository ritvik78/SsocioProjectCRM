// Seed: permission definitions + default statuses.
// Run with: `npx prisma db seed` (idempotent — safe to re-run).
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PERMISSIONS = [
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
];

const BRAND_STATUSES = [
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
  { name: "NO RESPONSE", color: "#f97316", order: 12 },
  { name: "CLOSED", color: "#6b7280", order: 13 },
  { name: "LOST", color: "#991b1b", order: 14 },
];

const INFLUENCER_STATUSES = [
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

async function main() {
  console.log("Seeding permissions…");
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { name: p.name, description: p.group },
      create: { key: p.key, name: p.name, description: p.group },
    });
  }

  console.log("Seeding brand statuses…");
  for (const s of BRAND_STATUSES) {
    await prisma.brandStatus.upsert({
      where: { name: s.name },
      update: { color: s.color, order: s.order, isDefault: s.name === "NEW LEAD" },
      create: { name: s.name, color: s.color, order: s.order, isDefault: s.name === "NEW LEAD" },
    });
  }

  console.log("Seeding influencer statuses…");
  for (const s of INFLUENCER_STATUSES) {
    await prisma.influencerStatus.upsert({
      where: { name: s.name },
      update: { color: s.color, order: s.order, isDefault: s.name === "NEW" },
      create: { name: s.name, color: s.color, order: s.order, isDefault: s.name === "NEW" },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });