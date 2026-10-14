-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('draft', 'frozen');

-- CreateTable
CREATE TABLE "DispatchDay" (
    "id" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "DispatchStatus" NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "frozenAt" TIMESTAMP(3),
    "frozenByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchSlot" (
    "id" TEXT NOT NULL,
    "dispatchDayId" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "qcUserId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "visitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DispatchDay_date_idx" ON "DispatchDay"("date");

-- CreateIndex
CREATE INDEX "DispatchDay_clusterId_idx" ON "DispatchDay"("clusterId");

-- CreateIndex
CREATE INDEX "DispatchDay_status_idx" ON "DispatchDay"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchDay_clusterId_date_key" ON "DispatchDay"("clusterId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchSlot_visitId_key" ON "DispatchSlot"("visitId");

-- CreateIndex
CREATE INDEX "DispatchSlot_dispatchDayId_idx" ON "DispatchSlot"("dispatchDayId");

-- CreateIndex
CREATE INDEX "DispatchSlot_depotId_idx" ON "DispatchSlot"("depotId");

-- CreateIndex
CREATE INDEX "DispatchSlot_qcUserId_idx" ON "DispatchSlot"("qcUserId");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchSlot_dispatchDayId_depotId_key" ON "DispatchSlot"("dispatchDayId", "depotId");

-- AddForeignKey
ALTER TABLE "DispatchDay" ADD CONSTRAINT "DispatchDay_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "Cluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchDay" ADD CONSTRAINT "DispatchDay_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchDay" ADD CONSTRAINT "DispatchDay_frozenByUserId_fkey" FOREIGN KEY ("frozenByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchSlot" ADD CONSTRAINT "DispatchSlot_dispatchDayId_fkey" FOREIGN KEY ("dispatchDayId") REFERENCES "DispatchDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchSlot" ADD CONSTRAINT "DispatchSlot_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchSlot" ADD CONSTRAINT "DispatchSlot_qcUserId_fkey" FOREIGN KEY ("qcUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchSlot" ADD CONSTRAINT "DispatchSlot_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
