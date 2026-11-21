-- Add the final Wakasek Kesiswaan approval stage and structured deposit items.

ALTER TYPE "Role" ADD VALUE 'WAKASEK_KESISWAAN';
ALTER TYPE "RequestStatus" ADD VALUE 'PENDING_WAKASEK';

ALTER TABLE "PermissionRequest"
  ADD COLUMN "depositItems" TEXT,
  ALTER COLUMN "mentorId" DROP NOT NULL;

-- Reorder approval flows: Pembina/Matta Pitta first, asrama staff/head next,
-- Wakasek Kesiswaan last where required.
UPDATE "PermissionType"
SET
  "approvalRoles" = '["PEMBINA","STAFF_ASRAMA","KEPALA_ASRAMA"]',
  "approvalLabels" = '{"PEMBINA":"Pembina / Pendamping","STAFF_ASRAMA":"Staf Asrama","KEPALA_ASRAMA":"Kepala Urusan Asrama"}',
  "formGuide" = 'Isi daftar siswa, Untuk, Hari/tanggal, Waktu, dan Tempat. Formulir diketahui Pembina/Pendamping dan Staf Asrama, lalu disetujui Kepala Urusan Asrama.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'Dispensasi Kegiatan Asrama';

UPDATE "PermissionType"
SET
  "approvalRoles" = '["STAFF_ASRAMA","KEPALA_ASRAMA"]',
  "approvalLabels" = '{"STAFF_ASRAMA":"Matta Pitta","KEPALA_ASRAMA":"Kepala Urusan Asrama"}',
  "formGuide" = 'Isi Nama, Grha, Hari/Tanggal, Yang Datang, dan Keperluan. Formulir diketahui Matta Pitta dan Pemohon/Siswa, lalu disetujui Kepala Urusan Asrama. Tidak memerlukan Pembina/Pendamping.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'Kunjungan Keluarga';

UPDATE "PermissionType"
SET
  "approvalRoles" = '["PEMBINA","STAFF_ASRAMA","KEPALA_ASRAMA"]',
  "approvalLabels" = '{"PEMBINA":"Pembina / Pendamping","STAFF_ASRAMA":"Kubutambahan / Staf Asrama","KEPALA_ASRAMA":"Kepala Urusan Asrama"}',
  "formGuide" = 'Isi daftar siswa, Untuk, Hari/tgl, Waktu, dan Tempat. Formulir diketahui Pembina/Pendamping dan Kubutambahan/Staf Asrama, lalu disetujui Kepala Urusan Asrama.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'Izin Keluar Asrama';

UPDATE "PermissionType"
SET
  "approvalRoles" = '["PEMBINA","STAFF_ASRAMA","WAKASEK_KESISWAAN"]',
  "approvalLabels" = '{"PEMBINA":"Pembina","STAFF_ASRAMA":"Kubutambahan / Staf Asrama","WAKASEK_KESISWAAN":"Wakasek Kesiswaan"}',
  "formGuide" = 'Isi daftar siswa, keperluan Mengambil HP dan memanfaatkan untuk, Hari/tgl, serta Waktu. Formulir diketahui Pembina dan Kubutambahan/Staf Asrama, lalu disetujui Wakasek Kesiswaan.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'Izin Penggunaan HP';

UPDATE "PermissionType"
SET
  "approvalRoles" = '["PEMBINA","STAFF_ASRAMA","WAKASEK_KESISWAAN"]',
  "approvalLabels" = '{"PEMBINA":"Yang memberi izin","STAFF_ASRAMA":"Matta Pitta / Kepala Urusan Asrama","WAKASEK_KESISWAAN":"Wakasek Kesiswaan"}',
  "formGuide" = 'Isi Nama, Kelas, Grha, Hari/Tanggal Kepulangan, Hari/Tanggal Kedatangan, dan Alasan/Keperluan. Formulir diketahui Yang memberi izin dan Matta Pitta/Kepala Urusan Asrama, lalu disetujui Wakasek Kesiswaan.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'Izin Pulang';

UPDATE "PermissionType"
SET
  "approvalRoles" = '["STAFF_ASRAMA","KEPALA_ASRAMA"]',
  "requiredFields" = '["depositItems"]',
  "fieldLabels" = '{"depositItems":"Daftar barang titipan (1-10)"}',
  "approvalLabels" = '{"STAFF_ASRAMA":"Matta Pitta","KEPALA_ASRAMA":"Kepala Urusan Asrama"}',
  "formGuide" = 'Isi daftar barang 1-10 dengan nama, jumlah, satuan, dan keterangan. Titipan makanan/minuman maksimal sekali per minggu per siswa per grha; uang dan obat wajib diketahui Matta Pitta. Tidak memerlukan Pembina/Pendamping.',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'Titipan Siswa';
