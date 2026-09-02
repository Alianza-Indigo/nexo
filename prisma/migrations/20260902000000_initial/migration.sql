-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CAREGIVER', 'PROFESSIONAL', 'CONTENT_ADMIN', 'SECURITY_ADMIN', 'SUPPORT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'STABLE', 'CLOSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('CRITICAL', 'URGENT', 'ELEVATED', 'MANAGEABLE', 'STABLE');

-- CreateEnum
CREATE TYPE "Actor" AS ENUM ('USER', 'ENGINE', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "Modality" AS ENUM ('BUTTON', 'TEXT', 'VOICE', 'STATIC');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('VOICE_PROCESSING', 'TRANSCRIPT_PERSISTENCE', 'PROFILE_CREATION', 'OFFLINE_STORAGE', 'PROFESSIONAL_SHARING', 'REPORT_GENERATION', 'COMMUNICATIONS', 'ANALYTICS', 'SESSION_PERSISTENCE');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('CRISIS_SHEET', 'SOAP_DRAFT');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'FINAL', 'DELETED');

-- CreateEnum
CREATE TYPE "ProtocolStatus" AS ENUM ('DRAFT', 'VALIDATED', 'APPROVED', 'DEPLOYED', 'RETIRED');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('PENDING', 'PROCESSING', 'TRANSCRIBED', 'DELETED', 'FAILED');

-- CreateEnum
CREATE TYPE "InterventionStatus" AS ENUM ('DRAFT', 'VALIDATED', 'RETIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "displayName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CAREGIVER',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "locale" TEXT NOT NULL DEFAULT 'es-MX',
    "timezone" TEXT NOT NULL DEFAULT 'America/Chihuahua',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaregiverProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredMode" TEXT NOT NULL DEFAULT 'voice_text',
    "ttsSpeed" DOUBLE PRECISION NOT NULL DEFAULT 0.9,
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "highContrast" BOOLEAN NOT NULL DEFAULT false,
    "crisisPreferences" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaregiverProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DependentProfile" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "aliasEncrypted" TEXT NOT NULL,
    "ageBand" TEXT NOT NULL,
    "pronounsEncrypted" TEXT,
    "communicationModes" TEXT[],
    "sensitivitiesEncrypted" TEXT,
    "observableSignsEncrypted" TEXT,
    "emergencyNotesEncrypted" TEXT,
    "saveOfflineAllowed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DependentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnownSupport" (
    "id" TEXT NOT NULL,
    "dependentProfileId" TEXT NOT NULL,
    "labelEncrypted" TEXT NOT NULL,
    "supportType" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "conditionsEncrypted" TEXT,
    "source" TEXT NOT NULL,
    "verifiedByProfessional" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiredAt" TIMESTAMP(3),

    CONSTRAINT "KnownSupport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrisisPlan" (
    "id" TEXT NOT NULL,
    "dependentProfileId" TEXT NOT NULL,
    "titleEncrypted" TEXT NOT NULL,
    "contentEncrypted" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "authorLabelEncrypted" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrisisPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustedContact" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "dependentProfileId" TEXT,
    "nameEncrypted" TEXT NOT NULL,
    "phoneEncrypted" TEXT NOT NULL,
    "relationshipEncrypted" TEXT,
    "consentConfirmed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustedContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrisisSession" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "guestSessionHash" TEXT,
    "dependentProfileId" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentState" TEXT NOT NULL DEFAULT 'DANGER_TRIAGE',
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'ELEVATED',
    "protocolVersion" TEXT NOT NULL DEFAULT '2.0',
    "promptVersion" TEXT NOT NULL DEFAULT '2.0',
    "safetyVersion" TEXT NOT NULL DEFAULT '1.0',
    "sessionVersion" INTEGER NOT NULL DEFAULT 1,
    "contextEncrypted" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stabilizedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "persistenceConsent" BOOLEAN NOT NULL DEFAULT false,
    "retentionUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrisisSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrisisEvent" (
    "id" TEXT NOT NULL,
    "crisisSessionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "stateFrom" TEXT NOT NULL,
    "stateTo" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "riskFlags" TEXT[],
    "interventionId" TEXT,
    "actor" "Actor" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrisisEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrisisMessage" (
    "id" TEXT NOT NULL,
    "crisisSessionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "role" "MessageRole" NOT NULL,
    "modality" "Modality" NOT NULL,
    "contentEncrypted" TEXT,
    "normalizedIntent" TEXT,
    "expectedAnswer" TEXT,
    "savedWithConsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrisisMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioAsset" (
    "id" TEXT NOT NULL,
    "crisisSessionId" TEXT NOT NULL,
    "privateBlobKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'PENDING',
    "deleteAfter" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudioAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyAssessment" (
    "id" TEXT NOT NULL,
    "crisisSessionId" TEXT NOT NULL,
    "messageId" TEXT,
    "flags" TEXT[],
    "riskLevel" "RiskLevel" NOT NULL,
    "uncertainty" BOOLEAN NOT NULL,
    "evidenceCategories" TEXT[],
    "modelReference" TEXT,
    "rulesVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionDefinition" (
    "id" TEXT NOT NULL,
    "stableKey" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "contentTemplate" TEXT NOT NULL,
    "constraints" JSONB NOT NULL,
    "status" "InterventionStatus" NOT NULL DEFAULT 'VALIDATED',
    "protocolVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterventionDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionRun" (
    "id" TEXT NOT NULL,
    "crisisSessionId" TEXT NOT NULL,
    "interventionDefinitionId" TEXT NOT NULL,
    "offeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted" BOOLEAN,
    "completionStatus" TEXT,
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterventionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostcrisisReport" (
    "id" TEXT NOT NULL,
    "crisisSessionId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "contentEncrypted" TEXT NOT NULL,
    "disclaimerVersion" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PostcrisisReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentReceipt" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestSessionHash" TEXT,
    "consentType" "ConsentType" NOT NULL,
    "noticeVersion" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "evidence" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ConsentReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareGrant" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "recipientHash" TEXT NOT NULL,
    "permissions" TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolVersion" (
    "id" TEXT NOT NULL,
    "semanticVersion" TEXT NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "status" "ProtocolStatus" NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "deployedAt" TIMESTAMP(3),
    "changelog" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProtocolVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceIdHash" TEXT NOT NULL,
    "metadataRedacted" JSONB NOT NULL,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthSession_userId_expiresAt_idx" ON "AuthSession"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_tokenHash_key" ON "VerificationToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "CaregiverProfile_userId_key" ON "CaregiverProfile"("userId");

-- CreateIndex
CREATE INDEX "DependentProfile_ownerUserId_deletedAt_idx" ON "DependentProfile"("ownerUserId", "deletedAt");

-- CreateIndex
CREATE INDEX "KnownSupport_dependentProfileId_accepted_idx" ON "KnownSupport"("dependentProfileId", "accepted");

-- CreateIndex
CREATE INDEX "CrisisPlan_dependentProfileId_active_idx" ON "CrisisPlan"("dependentProfileId", "active");

-- CreateIndex
CREATE INDEX "CrisisSession_ownerUserId_startedAt_idx" ON "CrisisSession"("ownerUserId", "startedAt");

-- CreateIndex
CREATE INDEX "CrisisSession_guestSessionHash_retentionUntil_idx" ON "CrisisSession"("guestSessionHash", "retentionUntil");

-- CreateIndex
CREATE INDEX "CrisisSession_status_retentionUntil_idx" ON "CrisisSession"("status", "retentionUntil");

-- CreateIndex
CREATE UNIQUE INDEX "CrisisEvent_crisisSessionId_sequence_key" ON "CrisisEvent"("crisisSessionId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "CrisisMessage_crisisSessionId_sequence_key" ON "CrisisMessage"("crisisSessionId", "sequence");

-- CreateIndex
CREATE INDEX "AudioAsset_status_deleteAfter_idx" ON "AudioAsset"("status", "deleteAfter");

-- CreateIndex
CREATE UNIQUE INDEX "InterventionDefinition_stableKey_key" ON "InterventionDefinition"("stableKey");

-- CreateIndex
CREATE INDEX "PostcrisisReport_ownerUserId_deletedAt_idx" ON "PostcrisisReport"("ownerUserId", "deletedAt");

-- CreateIndex
CREATE INDEX "ShareGrant_recipientHash_expiresAt_idx" ON "ShareGrant"("recipientHash", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProtocolVersion_semanticVersion_key" ON "ProtocolVersion"("semanticVersion");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_action_idx" ON "AuditEvent"("createdAt", "action");

-- CreateIndex
CREATE INDEX "IdempotencyKey_expiresAt_idx" ON "IdempotencyKey"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_scope_keyHash_key" ON "IdempotencyKey"("scope", "keyHash");

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaregiverProfile" ADD CONSTRAINT "CaregiverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DependentProfile" ADD CONSTRAINT "DependentProfile_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnownSupport" ADD CONSTRAINT "KnownSupport_dependentProfileId_fkey" FOREIGN KEY ("dependentProfileId") REFERENCES "DependentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrisisPlan" ADD CONSTRAINT "CrisisPlan_dependentProfileId_fkey" FOREIGN KEY ("dependentProfileId") REFERENCES "DependentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustedContact" ADD CONSTRAINT "TrustedContact_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustedContact" ADD CONSTRAINT "TrustedContact_dependentProfileId_fkey" FOREIGN KEY ("dependentProfileId") REFERENCES "DependentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrisisSession" ADD CONSTRAINT "CrisisSession_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrisisSession" ADD CONSTRAINT "CrisisSession_dependentProfileId_fkey" FOREIGN KEY ("dependentProfileId") REFERENCES "DependentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrisisEvent" ADD CONSTRAINT "CrisisEvent_crisisSessionId_fkey" FOREIGN KEY ("crisisSessionId") REFERENCES "CrisisSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrisisMessage" ADD CONSTRAINT "CrisisMessage_crisisSessionId_fkey" FOREIGN KEY ("crisisSessionId") REFERENCES "CrisisSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioAsset" ADD CONSTRAINT "AudioAsset_crisisSessionId_fkey" FOREIGN KEY ("crisisSessionId") REFERENCES "CrisisSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyAssessment" ADD CONSTRAINT "SafetyAssessment_crisisSessionId_fkey" FOREIGN KEY ("crisisSessionId") REFERENCES "CrisisSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyAssessment" ADD CONSTRAINT "SafetyAssessment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "CrisisMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionRun" ADD CONSTRAINT "InterventionRun_crisisSessionId_fkey" FOREIGN KEY ("crisisSessionId") REFERENCES "CrisisSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionRun" ADD CONSTRAINT "InterventionRun_interventionDefinitionId_fkey" FOREIGN KEY ("interventionDefinitionId") REFERENCES "InterventionDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostcrisisReport" ADD CONSTRAINT "PostcrisisReport_crisisSessionId_fkey" FOREIGN KEY ("crisisSessionId") REFERENCES "CrisisSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostcrisisReport" ADD CONSTRAINT "PostcrisisReport_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentReceipt" ADD CONSTRAINT "ConsentReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareGrant" ADD CONSTRAINT "ShareGrant_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
