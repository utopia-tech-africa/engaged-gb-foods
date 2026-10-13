-- CreateEnum
CREATE TYPE "RecceDecision" AS ENUM ('ready', 'hold');

-- CreateEnum
CREATE TYPE "AssessmentResult" AS ENUM ('pass', 'fail', 'pending');

-- CreateTable
CREATE TABLE "Recce" (
    "id" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "checklist" JSONB NOT NULL,
    "decision" "RecceDecision" NOT NULL,
    "notes" TEXT,
    "authorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecceGap" (
    "id" TEXT NOT NULL,
    "recceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecceGap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecceEvidence" (
    "id" TEXT NOT NULL,
    "recceId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecceEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "safetyPass" BOOLEAN NOT NULL,
    "qualityPass" BOOLEAN NOT NULL,
    "recordsPass" BOOLEAN NOT NULL,
    "result" "AssessmentResult" NOT NULL,
    "notes" TEXT,
    "assessedByUserId" TEXT NOT NULL,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Recce_depotId_idx" ON "Recce"("depotId");

-- CreateIndex
CREATE INDEX "Recce_decision_idx" ON "Recce"("decision");

-- CreateIndex
CREATE INDEX "RecceGap_recceId_idx" ON "RecceGap"("recceId");

-- CreateIndex
CREATE INDEX "RecceEvidence_recceId_idx" ON "RecceEvidence"("recceId");

-- CreateIndex
CREATE INDEX "Assessment_userId_idx" ON "Assessment"("userId");

-- CreateIndex
CREATE INDEX "Assessment_result_idx" ON "Assessment"("result");

-- AddForeignKey
ALTER TABLE "Recce" ADD CONSTRAINT "Recce_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recce" ADD CONSTRAINT "Recce_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecceGap" ADD CONSTRAINT "RecceGap_recceId_fkey" FOREIGN KEY ("recceId") REFERENCES "Recce"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecceEvidence" ADD CONSTRAINT "RecceEvidence_recceId_fkey" FOREIGN KEY ("recceId") REFERENCES "Recce"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_assessedByUserId_fkey" FOREIGN KEY ("assessedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
