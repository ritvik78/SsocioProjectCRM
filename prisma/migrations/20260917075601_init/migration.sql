-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "authId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "designation" TEXT,
    "role" TEXT NOT NULL DEFAULT 'TEAM_MEMBER',
    "status" TEXT NOT NULL DEFAULT 'INVITED',
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandStatus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6b7280',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "contactName" TEXT,
    "designation" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "instagramHandle" TEXT,
    "linkedin" TEXT,
    "industry" TEXT,
    "city" TEXT,
    "state" TEXT,
    "source" TEXT,
    "statusId" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "leadOwnerId" TEXT,
    "lastContactedAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "onboardingDate" TIMESTAMP(3),
    "campaignStatus" TEXT,
    "businessCategory" TEXT,
    "location" TEXT,
    "gstNumber" TEXT,
    "description" TEXT,
    "productsServices" TEXT,
    "collaborationType" TEXT,
    "expectedCampaignType" TEXT,
    "budget" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerStatus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6b7280',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InfluencerStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Influencer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instagramUsername" TEXT,
    "instagramUrl" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "state" TEXT,
    "category" TEXT,
    "followers" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "platform" TEXT NOT NULL DEFAULT 'INSTAGRAM',
    "audienceLocation" TEXT,
    "source" TEXT,
    "statusId" TEXT NOT NULL,
    "notes" TEXT,
    "assignedToId" TEXT,
    "lastContactedAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "onboardingDate" TIMESTAMP(3),
    "contentType" TEXT,
    "preferredCollaboration" TEXT,
    "audienceDemographics" TEXT,
    "portfolio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Influencer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "description" TEXT,
    "objective" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" TEXT,
    "cashbackIncentive" TEXT,
    "targetInfluencers" INTEGER,
    "requiredContent" TEXT,
    "instagramRequirements" TEXT,
    "hashtags" TEXT,
    "mentions" TEXT,
    "termsConditions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignInfluencer" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "responseText" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignInfluencer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL_BUSINESS',
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "variables" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMessage" (
    "id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "senderName" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "templateId" TEXT,
    "brandId" TEXT,
    "influencerId" TEXT,
    "campaignId" TEXT,
    "sentById" TEXT,
    "providerMessageId" TEXT,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "openStatus" BOOLEAN NOT NULL DEFAULT false,
    "clickStatus" BOOLEAN NOT NULL DEFAULT false,
    "responseStatus" TEXT,
    "followUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailEvent" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramOutreach" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT,
    "instagramUsername" TEXT NOT NULL,
    "instagramUrl" TEXT,
    "outreachDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT,
    "outreachType" TEXT NOT NULL DEFAULT 'DM',
    "assignedToId" TEXT,
    "response" TEXT,
    "responseDate" TIMESTAMP(3),
    "followUpDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'MESSAGE_SENT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramOutreach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "influencerId" TEXT,
    "type" TEXT NOT NULL,
    "text" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT,
    "notes" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Followup" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "influencerId" TEXT,
    "contactType" TEXT NOT NULL DEFAULT 'EMAIL',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "assignedToId" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Followup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "influencerId" TEXT,
    "campaignId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "meta" JSONB,
    "previousValue" TEXT,
    "newValue" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "link" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "recordType" TEXT,
    "recordId" TEXT,
    "previousValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL,
    "permissions" JSONB,
    "invitedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_authId_key" ON "User"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "Permission_key_idx" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "UserPermission_userId_idx" ON "UserPermission"("userId");

-- CreateIndex
CREATE INDEX "UserPermission_permissionId_idx" ON "UserPermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permissionId_key" ON "UserPermission"("userId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandStatus_name_key" ON "BrandStatus"("name");

-- CreateIndex
CREATE INDEX "BrandStatus_order_idx" ON "BrandStatus"("order");

-- CreateIndex
CREATE INDEX "Brand_statusId_idx" ON "Brand"("statusId");

-- CreateIndex
CREATE INDEX "Brand_leadOwnerId_idx" ON "Brand"("leadOwnerId");

-- CreateIndex
CREATE INDEX "Brand_email_idx" ON "Brand"("email");

-- CreateIndex
CREATE INDEX "Brand_createdAt_idx" ON "Brand"("createdAt");

-- CreateIndex
CREATE INDEX "Brand_nextFollowUpAt_idx" ON "Brand"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "Brand_priority_idx" ON "Brand"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "InfluencerStatus_name_key" ON "InfluencerStatus"("name");

-- CreateIndex
CREATE INDEX "InfluencerStatus_order_idx" ON "InfluencerStatus"("order");

-- CreateIndex
CREATE INDEX "Influencer_statusId_idx" ON "Influencer"("statusId");

-- CreateIndex
CREATE INDEX "Influencer_assignedToId_idx" ON "Influencer"("assignedToId");

-- CreateIndex
CREATE INDEX "Influencer_email_idx" ON "Influencer"("email");

-- CreateIndex
CREATE INDEX "Influencer_instagramUsername_idx" ON "Influencer"("instagramUsername");

-- CreateIndex
CREATE INDEX "Influencer_createdAt_idx" ON "Influencer"("createdAt");

-- CreateIndex
CREATE INDEX "Influencer_nextFollowUpAt_idx" ON "Influencer"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "Campaign_brandId_idx" ON "Campaign"("brandId");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_createdAt_idx" ON "Campaign"("createdAt");

-- CreateIndex
CREATE INDEX "CampaignInfluencer_influencerId_idx" ON "CampaignInfluencer"("influencerId");

-- CreateIndex
CREATE INDEX "CampaignInfluencer_status_idx" ON "CampaignInfluencer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignInfluencer_campaignId_influencerId_key" ON "CampaignInfluencer"("campaignId", "influencerId");

-- CreateIndex
CREATE INDEX "EmailTemplate_category_idx" ON "EmailTemplate"("category");

-- CreateIndex
CREATE INDEX "EmailTemplate_status_idx" ON "EmailTemplate"("status");

-- CreateIndex
CREATE INDEX "EmailTemplate_createdById_idx" ON "EmailTemplate"("createdById");

-- CreateIndex
CREATE INDEX "EmailMessage_recipient_idx" ON "EmailMessage"("recipient");

-- CreateIndex
CREATE INDEX "EmailMessage_brandId_idx" ON "EmailMessage"("brandId");

-- CreateIndex
CREATE INDEX "EmailMessage_influencerId_idx" ON "EmailMessage"("influencerId");

-- CreateIndex
CREATE INDEX "EmailMessage_sentById_idx" ON "EmailMessage"("sentById");

-- CreateIndex
CREATE INDEX "EmailMessage_deliveryStatus_idx" ON "EmailMessage"("deliveryStatus");

-- CreateIndex
CREATE INDEX "EmailMessage_createdAt_idx" ON "EmailMessage"("createdAt");

-- CreateIndex
CREATE INDEX "EmailMessage_followUpDate_idx" ON "EmailMessage"("followUpDate");

-- CreateIndex
CREATE INDEX "EmailEvent_emailId_idx" ON "EmailEvent"("emailId");

-- CreateIndex
CREATE INDEX "EmailEvent_eventType_idx" ON "EmailEvent"("eventType");

-- CreateIndex
CREATE INDEX "InstagramOutreach_influencerId_idx" ON "InstagramOutreach"("influencerId");

-- CreateIndex
CREATE INDEX "InstagramOutreach_status_idx" ON "InstagramOutreach"("status");

-- CreateIndex
CREATE INDEX "InstagramOutreach_assignedToId_idx" ON "InstagramOutreach"("assignedToId");

-- CreateIndex
CREATE INDEX "InstagramOutreach_createdAt_idx" ON "InstagramOutreach"("createdAt");

-- CreateIndex
CREATE INDEX "Response_brandId_idx" ON "Response"("brandId");

-- CreateIndex
CREATE INDEX "Response_influencerId_idx" ON "Response"("influencerId");

-- CreateIndex
CREATE INDEX "Response_type_idx" ON "Response"("type");

-- CreateIndex
CREATE INDEX "Response_recordedById_idx" ON "Response"("recordedById");

-- CreateIndex
CREATE INDEX "Response_date_idx" ON "Response"("date");

-- CreateIndex
CREATE INDEX "Followup_brandId_idx" ON "Followup"("brandId");

-- CreateIndex
CREATE INDEX "Followup_influencerId_idx" ON "Followup"("influencerId");

-- CreateIndex
CREATE INDEX "Followup_dueDate_idx" ON "Followup"("dueDate");

-- CreateIndex
CREATE INDEX "Followup_status_idx" ON "Followup"("status");

-- CreateIndex
CREATE INDEX "Followup_assignedToId_idx" ON "Followup"("assignedToId");

-- CreateIndex
CREATE INDEX "Activity_brandId_idx" ON "Activity"("brandId");

-- CreateIndex
CREATE INDEX "Activity_influencerId_idx" ON "Activity"("influencerId");

-- CreateIndex
CREATE INDEX "Activity_campaignId_idx" ON "Activity"("campaignId");

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_readAt_idx" ON "Notification"("readAt");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_recordType_idx" ON "AuditLog"("recordType");

-- CreateIndex
CREATE INDEX "AuditLog_recordId_idx" ON "AuditLog"("recordId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE INDEX "Setting_key_idx" ON "Setting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- CreateIndex
CREATE INDEX "Invitation_status_idx" ON "Invitation"("status");

-- CreateIndex
CREATE INDEX "Invitation_expiresAt_idx" ON "Invitation"("expiresAt");

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "BrandStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_leadOwnerId_fkey" FOREIGN KEY ("leadOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Influencer" ADD CONSTRAINT "Influencer_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "InfluencerStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Influencer" ADD CONSTRAINT "Influencer_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignInfluencer" ADD CONSTRAINT "CampaignInfluencer_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignInfluencer" ADD CONSTRAINT "CampaignInfluencer_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "EmailMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramOutreach" ADD CONSTRAINT "InstagramOutreach_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramOutreach" ADD CONSTRAINT "InstagramOutreach_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Followup" ADD CONSTRAINT "Followup_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Followup" ADD CONSTRAINT "Followup_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Followup" ADD CONSTRAINT "Followup_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Followup" ADD CONSTRAINT "Followup_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
