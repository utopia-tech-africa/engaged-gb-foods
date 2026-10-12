-- CreateEnum
CREATE TYPE "DispositionDecision" AS ENUM ('release', 'hold', 'reject', 'approve_repack');

-- CreateEnum
CREATE TYPE "SignatureRole" AS ENUM ('qc', 'cluster_supervisor', 'depot_representative');

-- AlterEnum
ALTER TYPE "StockMovementType" ADD VALUE 'disposition';

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN "reconciledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Disposition" (
    "id" TEXT NOT NULL,
    "stockLotId" TEXT NOT NULL,
    "decision" "DispositionDecision" NOT NULL,
    "reason" TEXT NOT NULL,
    "decidedByUserId" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Disposition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitSignature" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "role" "SignatureRole" NOT NULL,
    "signerName" TEXT NOT NULL,
    "imageObjectKey" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedByUserId" TEXT,

    CONSTRAINT "VisitSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitOpenAction" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "acceptedByGBfoods" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitOpenAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Disposition_stockLotId_idx" ON "Disposition"("stockLotId");

-- CreateIndex
CREATE INDEX "Disposition_decidedByUserId_idx" ON "Disposition"("decidedByUserId");

-- CreateIndex
CREATE INDEX "Disposition_decidedAt_idx" ON "Disposition"("decidedAt");

-- CreateIndex
CREATE INDEX "VisitSignature_visitId_idx" ON "VisitSignature"("visitId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitSignature_visitId_role_key" ON "VisitSignature"("visitId", "role");

-- CreateIndex
CREATE INDEX "VisitOpenAction_visitId_idx" ON "VisitOpenAction"("visitId");

-- AddForeignKey
ALTER TABLE "Disposition" ADD CONSTRAINT "Disposition_stockLotId_fkey" FOREIGN KEY ("stockLotId") REFERENCES "StockLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disposition" ADD CONSTRAINT "Disposition_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitSignature" ADD CONSTRAINT "VisitSignature_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitSignature" ADD CONSTRAINT "VisitSignature_signedByUserId_fkey" FOREIGN KEY ("signedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitOpenAction" ADD CONSTRAINT "VisitOpenAction_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
