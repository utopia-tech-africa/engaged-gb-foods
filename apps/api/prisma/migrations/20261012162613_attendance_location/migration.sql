-- CreateEnum
CREATE TYPE "AttendanceKind" AS ENUM ('check_in', 'check_out');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('scheduled', 'in_progress', 'complete', 'exception');

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "qcUserId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "visitId" TEXT,
    "userId" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "kind" "AttendanceKind" NOT NULL,
    "photoObjectKey" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accuracyMeters" DOUBLE PRECISION,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Visit_code_key" ON "Visit"("code");

-- CreateIndex
CREATE INDEX "Visit_depotId_idx" ON "Visit"("depotId");

-- CreateIndex
CREATE INDEX "Visit_qcUserId_idx" ON "Visit"("qcUserId");

-- CreateIndex
CREATE INDEX "Visit_date_idx" ON "Visit"("date");

-- CreateIndex
CREATE INDEX "Visit_status_idx" ON "Visit"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Visit_depotId_qcUserId_date_key" ON "Visit"("depotId", "qcUserId", "date");

-- CreateIndex
CREATE INDEX "Attendance_depotId_idx" ON "Attendance"("depotId");

-- CreateIndex
CREATE INDEX "Attendance_userId_idx" ON "Attendance"("userId");

-- CreateIndex
CREATE INDEX "Attendance_visitId_idx" ON "Attendance"("visitId");

-- CreateIndex
CREATE INDEX "Attendance_capturedAt_idx" ON "Attendance"("capturedAt");

-- CreateIndex
CREATE INDEX "Attendance_depotId_capturedAt_idx" ON "Attendance"("depotId", "capturedAt");

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_qcUserId_fkey" FOREIGN KEY ("qcUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
