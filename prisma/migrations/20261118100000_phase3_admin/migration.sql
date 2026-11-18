-- CreateTable
CREATE TABLE "PermissionType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermissionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "minLeadDays" INTEGER NOT NULL DEFAULT 0,
    "maxRangeDays" INTEGER NOT NULL DEFAULT 14,
    "maxStudentsPerRequest" INTEGER NOT NULL DEFAULT 50,
    "approvalDeadlineDays" INTEGER NOT NULL DEFAULT 3,
    "defaultStartTime" TEXT NOT NULL DEFAULT '08:00',
    "defaultEndTime" TEXT NOT NULL DEFAULT '12:00',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermissionSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PermissionType_name_key" ON "PermissionType"("name");

-- CreateIndex
CREATE INDEX "PermissionType_isActive_sortOrder_idx" ON "PermissionType"("isActive", "sortOrder");

-- AlterTable
ALTER TABLE "StaffProfile" ADD COLUMN "canBeMentor" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "StaffProfile_canBeMentor_idx" ON "StaffProfile"("canBeMentor");

-- Seed the initial permission type and settings so existing requests and new
-- installs have a valid reference.
INSERT INTO "PermissionType" ("id", "name", "description", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES (
    'pt_default_dispensasi',
    'Dispensasi Kegiatan Asrama',
    'Izin untuk mengikuti kegiatan di luar rutinitas asrama, baik di dalam maupun di luar lingkungan sekolah.',
    true,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "PermissionSetting" ("id", "updatedAt")
VALUES ('default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Preserve existing requests while moving from the RequestType enum to a
-- PermissionType relation.
ALTER TABLE "PermissionRequest" ADD COLUMN "typeId" TEXT;

UPDATE "PermissionRequest"
SET "typeId" = (
    SELECT "id"
    FROM "PermissionType"
    WHERE "name" = 'Dispensasi Kegiatan Asrama'
    LIMIT 1
)
WHERE "typeId" IS NULL;

ALTER TABLE "PermissionRequest" ALTER COLUMN "typeId" SET NOT NULL;

ALTER TABLE "PermissionRequest" DROP COLUMN "type";

DROP TYPE "RequestType";

-- CreateIndex
CREATE INDEX "PermissionRequest_typeId_status_createdAt_idx" ON "PermissionRequest"("typeId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "PermissionRequest" ADD CONSTRAINT "PermissionRequest_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "PermissionType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
