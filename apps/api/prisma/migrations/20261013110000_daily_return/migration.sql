-- CreateTable
CREATE TABLE "DailyReturn" (
    "id" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedByUserId" TEXT NOT NULL,
    "coverageSummary" TEXT NOT NULL,
    "stockStatusSummary" TEXT NOT NULL,
    "variancesSummary" TEXT,
    "incidentsSummary" TEXT,
    "depotsPlanned" INTEGER NOT NULL,
    "depotsCompleted" INTEGER NOT NULL,
    "depotsException" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReturn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyReturn_date_idx" ON "DailyReturn"("date");

-- CreateIndex
CREATE INDEX "DailyReturn_regionId_idx" ON "DailyReturn"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReturn_regionId_date_key" ON "DailyReturn"("regionId", "date");

-- AddForeignKey
ALTER TABLE "DailyReturn" ADD CONSTRAINT "DailyReturn_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyReturn" ADD CONSTRAINT "DailyReturn_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
