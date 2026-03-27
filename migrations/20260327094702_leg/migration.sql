-- AlterTable
ALTER TABLE "User" ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "lastNotifSeenAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "legislation_feed_registry" (
    "id" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "jurisdictionName" TEXT NOT NULL,
    "feedUrl" TEXT NOT NULL,
    "feedType" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastPolledAt" TIMESTAMP(3),
    "lastSuccessfulAt" TIMESTAMP(3),
    "lastError" TEXT,
    "lastHttpStatus" INTEGER,
    "itemsLastPoll" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legislation_feed_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legislation_changes" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "changeType" TEXT NOT NULL DEFAULT 'unknown',
    "legislationUrl" TEXT,
    "austliiUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "feedSummary" TEXT,
    "fullText" TEXT,
    "textFetched" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legislation_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legislation_area_tags" (
    "changeId" TEXT NOT NULL,
    "areaSlug" TEXT NOT NULL,
    "relevanceConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "assignedBy" TEXT NOT NULL DEFAULT 'ai',

    CONSTRAINT "legislation_area_tags_pkey" PRIMARY KEY ("changeId","areaSlug")
);

-- CreateTable
CREATE TABLE "legislation_change_analyses" (
    "id" TEXT NOT NULL,
    "changeId" TEXT NOT NULL,
    "changeSummary" TEXT NOT NULL,
    "practiceImpact" TEXT NOT NULL,
    "affectedAreas" TEXT[],
    "significanceScore" INTEGER NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legislation_change_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legislation_changes_externalId_key" ON "legislation_changes"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "legislation_change_analyses_changeId_key" ON "legislation_change_analyses"("changeId");

-- AddForeignKey
ALTER TABLE "legislation_area_tags" ADD CONSTRAINT "legislation_area_tags_changeId_fkey" FOREIGN KEY ("changeId") REFERENCES "legislation_changes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legislation_area_tags" ADD CONSTRAINT "legislation_area_tags_areaSlug_fkey" FOREIGN KEY ("areaSlug") REFERENCES "law_areas"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legislation_change_analyses" ADD CONSTRAINT "legislation_change_analyses_changeId_fkey" FOREIGN KEY ("changeId") REFERENCES "legislation_changes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
