-- Add student profile photos and complete the Izin Pulang departure/return times.

ALTER TABLE "User"
  ADD COLUMN "avatarUrl" TEXT;

-- Requests must be submitted at least one day before the dispensation.
ALTER TABLE "PermissionSetting"
  ALTER COLUMN "minLeadDays" SET DEFAULT 1;

UPDATE "PermissionSetting"
SET "minLeadDays" = 1
WHERE "id" = 'default';

-- Izin Pulang records the departure and arrival clock times in startTime/endTime.
UPDATE "PermissionType"
SET
  "requiredFields" = '["purpose","startDate","endDate","departureTime","returnTime"]',
  "fieldLabels" = '{"startDate":"Hari / tanggal kepulangan","endDate":"Hari / tanggal kedatangan","purpose":"Alasan / keperluan","departureTime":"Jam pulang","returnTime":"Jam kedatangan"}',
  "formGuide" = 'Isi Nama, Kelas, Grha, Hari/Tanggal Kepulangan, Jam Pulang, Hari/Tanggal Kedatangan, Jam Kedatangan, dan Alasan/Keperluan. Pengajuan dapat diajukan paling lambat 1 hari sebelum akan melakukan dispensasi. Formulir diketahui Yang memberi izin dan Matta Pitta/Kepala Urusan Asrama, lalu disetujui Wakasek Kesiswaan.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'Izin Pulang';
