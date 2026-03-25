-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "dashboardRunsThisWeek" INTEGER NOT NULL DEFAULT 0,
    "dashboardRunsResetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rss_feed_registry" (
    "id" TEXT NOT NULL,
    "courtCode" TEXT NOT NULL,
    "courtName" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'jade',
    "feedUrl" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastPolledAt" TIMESTAMP(3),
    "lastSuccessfulAt" TIMESTAMP(3),
    "lastError" TEXT,
    "lastHttpStatus" INTEGER,
    "itemsLastPoll" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rss_feed_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "law_areas" (
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "searchTerms" TEXT[],
    "catchwordPatterns" TEXT[],
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "law_areas_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "user_areas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "areaSlug" TEXT NOT NULL,
    "emailFrequency" TEXT NOT NULL DEFAULT 'weekly',

    CONSTRAINT "user_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "citation" TEXT NOT NULL,
    "caseName" TEXT NOT NULL,
    "court" TEXT NOT NULL,
    "courtCode" TEXT NOT NULL,
    "decisionDate" TIMESTAMP(3),
    "austliiUrl" TEXT,
    "jadeUrl" TEXT,
    "catchwords" TEXT,
    "judgmentExcerpt" TEXT,
    "excerptFetched" BOOLEAN NOT NULL DEFAULT false,
    "bench" TEXT,
    "orders" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_area_tags" (
    "caseId" TEXT NOT NULL,
    "areaSlug" TEXT NOT NULL,
    "relevanceConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "assignedBy" TEXT NOT NULL DEFAULT 'triage_claude',

    CONSTRAINT "case_area_tags_pkey" PRIMARY KEY ("caseId","areaSlug")
);

-- CreateTable
CREATE TABLE "case_analyses" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "factsSummary" TEXT NOT NULL,
    "legalAnalysis" TEXT NOT NULL,
    "whyItMatters" TEXT NOT NULL,
    "significanceScore" INTEGER NOT NULL,
    "scoreJustification" TEXT,
    "primaryArea" TEXT NOT NULL,
    "secondaryAreas" TEXT[],
    "classificationReasoning" TEXT,
    "modelUsed" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_runs" (
    "id" TEXT NOT NULL,
    "periodType" TEXT NOT NULL DEFAULT 'weekly',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "courtsPolled" TEXT[],
    "casesDiscovered" INTEGER NOT NULL DEFAULT 0,
    "casesTriaged" INTEGER NOT NULL DEFAULT 0,
    "casesAnalysed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "discovery_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_digests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodType" TEXT NOT NULL DEFAULT 'weekly',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "areaSlugs" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "digestSummary" TEXT,
    "modelUsed" TEXT,
    "tokensUsed" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "user_digests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_digest_top_cases" (
    "id" TEXT NOT NULL,
    "digestId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "factsSummary" TEXT NOT NULL,
    "legalAnalysis" TEXT NOT NULL,
    "whyItMatters" TEXT NOT NULL,
    "significanceScore" INTEGER NOT NULL,
    "primaryArea" TEXT NOT NULL,

    CONSTRAINT "user_digest_top_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_digest_extended_cases" (
    "id" TEXT NOT NULL,
    "digestId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "significanceScore" INTEGER NOT NULL,
    "primaryArea" TEXT NOT NULL,
    "oneLineSummary" TEXT NOT NULL,

    CONSTRAINT "user_digest_extended_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_sends" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "digestId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "emailType" TEXT NOT NULL,

    CONSTRAINT "email_sends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auth" (
    "id" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Auth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthIdentity" (
    "providerName" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerData" TEXT NOT NULL DEFAULT '{}',
    "authId" TEXT NOT NULL,

    CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("providerName","providerUserId")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rss_feed_registry_courtCode_key" ON "rss_feed_registry"("courtCode");

-- CreateIndex
CREATE UNIQUE INDEX "user_areas_userId_areaSlug_key" ON "user_areas"("userId", "areaSlug");

-- CreateIndex
CREATE UNIQUE INDEX "cases_citation_key" ON "cases"("citation");

-- CreateIndex
CREATE UNIQUE INDEX "case_analyses_caseId_key" ON "case_analyses"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "Auth_userId_key" ON "Auth"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_id_key" ON "Session"("id");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- AddForeignKey
ALTER TABLE "user_areas" ADD CONSTRAINT "user_areas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_areas" ADD CONSTRAINT "user_areas_areaSlug_fkey" FOREIGN KEY ("areaSlug") REFERENCES "law_areas"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_area_tags" ADD CONSTRAINT "case_area_tags_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_area_tags" ADD CONSTRAINT "case_area_tags_areaSlug_fkey" FOREIGN KEY ("areaSlug") REFERENCES "law_areas"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_analyses" ADD CONSTRAINT "case_analyses_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_digests" ADD CONSTRAINT "user_digests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_digest_top_cases" ADD CONSTRAINT "user_digest_top_cases_digestId_fkey" FOREIGN KEY ("digestId") REFERENCES "user_digests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_digest_top_cases" ADD CONSTRAINT "user_digest_top_cases_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_digest_extended_cases" ADD CONSTRAINT "user_digest_extended_cases_digestId_fkey" FOREIGN KEY ("digestId") REFERENCES "user_digests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_digest_extended_cases" ADD CONSTRAINT "user_digest_extended_cases_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_sends" ADD CONSTRAINT "email_sends_digestId_fkey" FOREIGN KEY ("digestId") REFERENCES "user_digests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auth" ADD CONSTRAINT "Auth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthIdentity" ADD CONSTRAINT "AuthIdentity_authId_fkey" FOREIGN KEY ("authId") REFERENCES "Auth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Auth"("id") ON DELETE CASCADE ON UPDATE CASCADE;
