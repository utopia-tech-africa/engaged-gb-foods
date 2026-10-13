-- CreateEnum
CREATE TYPE "EscalationTrigger" AS ENUM ('quality_or_safety', 'count_mismatch', 'access_or_crew', 'excess_volume_or_delay');

-- CreateEnum
CREATE TYPE "EscalationStatus" AS ENUM ('open', 'in_progress', 'resolved');

-- CreateTable
CREATE TABLE "Escalation" (
    "id" TEXT NOT NULL,
    "visitId" TEXT,
    "depotId" TEXT NOT NULL,
    "trigger" "EscalationTrigger" NOT NULL,
    "status" "EscalationStatus" NOT NULL DEFAULT 'open',
    "note" TEXT NOT NULL,
    "ownerName" TEXT,
    "dueAt" TIMESTAMP(3),
    "writtenRecord" TEXT,
    "reportedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Escalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EscalationEvidence" (
    "id" TEXT NOT NULL,
    "escalationId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscalationEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Escalation_depotId_idx" ON "Escalation"("depotId");

-- CreateIndex
CREATE INDEX "Escalation_visitId_idx" ON "Escalation"("visitId");

-- CreateIndex
CREATE INDEX "Escalation_status_idx" ON "Escalation"("status");

-- CreateIndex
CREATE INDEX "Escalation_createdAt_idx" ON "Escalation"("createdAt");

-- CreateIndex
CREATE INDEX "EscalationEvidence_escalationId_idx" ON "EscalationEvidence"("escalationId");

-- AddForeignKey
ALTER TABLE "Escalation" ADD CONSTRAINT "Escalation_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escalation" ADD CONSTRAINT "Escalation_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escalation" ADD CONSTRAINT "Escalation_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EscalationEvidence" ADD CONSTRAINT "EscalationEvidence_escalationId_fkey" FOREIGN KEY ("escalationId") REFERENCES "Escalation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
