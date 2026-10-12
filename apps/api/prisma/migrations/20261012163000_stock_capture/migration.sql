-- CreateEnum
CREATE TYPE "StockZone" AS ENUM ('unexamined', 'conforming_pending_release', 'recoverable_pending_approval', 'held_or_rejected', 'released_remaining_on_site');

-- CreateEnum
CREATE TYPE "StockUnit" AS ENUM ('cases', 'loose_packs');

-- CreateEnum
CREATE TYPE "StockEvidenceCategory" AS ENUM ('pack', 'batch', 'defect', 'position');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('opening');

-- CreateTable
CREATE TABLE "Sku" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "packFactor" INTEGER NOT NULL DEFAULT 1,
    "caseUnit" TEXT NOT NULL,
    "looseUnit" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DefectCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DefectCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockLot" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "batchCode" TEXT NOT NULL,
    "expiryDate" DATE,
    "zone" "StockZone" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" "StockUnit" NOT NULL,
    "baseQuantity" INTEGER NOT NULL,
    "custodian" TEXT,
    "notes" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracyMeters" DOUBLE PRECISION,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockEvidence" (
    "id" TEXT NOT NULL,
    "stockLotId" TEXT NOT NULL,
    "category" "StockEvidenceCategory" NOT NULL,
    "objectKey" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "stockLotId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "baseQuantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sku_name_key" ON "Sku"("name");

-- CreateIndex
CREATE INDEX "Sku_isActive_idx" ON "Sku"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DefectCode_code_key" ON "DefectCode"("code");

-- CreateIndex
CREATE INDEX "DefectCode_isActive_idx" ON "DefectCode"("isActive");

-- CreateIndex
CREATE INDEX "StockLot_visitId_idx" ON "StockLot"("visitId");

-- CreateIndex
CREATE INDEX "StockLot_skuId_idx" ON "StockLot"("skuId");

-- CreateIndex
CREATE INDEX "StockLot_zone_idx" ON "StockLot"("zone");

-- CreateIndex
CREATE INDEX "StockLot_createdByUserId_idx" ON "StockLot"("createdByUserId");

-- CreateIndex
CREATE INDEX "StockLot_createdAt_idx" ON "StockLot"("createdAt");

-- CreateIndex
CREATE INDEX "StockEvidence_stockLotId_idx" ON "StockEvidence"("stockLotId");

-- CreateIndex
CREATE INDEX "StockEvidence_category_idx" ON "StockEvidence"("category");

-- CreateIndex
CREATE INDEX "StockMovement_stockLotId_idx" ON "StockMovement"("stockLotId");

-- CreateIndex
CREATE INDEX "StockMovement_type_idx" ON "StockMovement"("type");

-- AddForeignKey
ALTER TABLE "StockLot" ADD CONSTRAINT "StockLot_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLot" ADD CONSTRAINT "StockLot_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockLot" ADD CONSTRAINT "StockLot_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEvidence" ADD CONSTRAINT "StockEvidence_stockLotId_fkey" FOREIGN KEY ("stockLotId") REFERENCES "StockLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_stockLotId_fkey" FOREIGN KEY ("stockLotId") REFERENCES "StockLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
