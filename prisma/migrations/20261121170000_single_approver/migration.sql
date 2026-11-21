-- Use a single approver per permission type. Existing tiered configurations are
-- normalized to STAFF_ASRAMA until an admin chooses a different role.

ALTER TABLE "PermissionType"
  ALTER COLUMN "approvalRoles" SET DEFAULT '["STAFF_ASRAMA"]';

UPDATE "PermissionType"
SET
  "approvalRoles" = '["STAFF_ASRAMA"]',
  "approvalLabels" = CASE
    WHEN "name" IN ('Kunjungan Keluarga', 'Titipan Siswa')
      THEN '{"STAFF_ASRAMA":"Matta Pitta"}'
    WHEN "name" IN ('Izin Penggunaan HP', 'Izin Pulang')
      THEN '{"STAFF_ASRAMA":"Matta Pitta / Kepala Urusan Asrama"}'
    ELSE '{"STAFF_ASRAMA":"Staf Asrama"}'
  END,
  "formGuide" = CASE
    WHEN "name" = 'Dispensasi Kegiatan Asrama'
      THEN 'Isi daftar siswa, Untuk, Hari/tanggal, Waktu, dan Tempat. Pengajuan cukup menunggu satu penyetuju yang ditentukan admin untuk jenis izin ini.'
    WHEN "name" = 'Kunjungan Keluarga'
      THEN 'Isi Nama, Grha, Hari/Tanggal, Yang Datang, dan Keperluan. Pengajuan cukup menunggu satu penyetuju yang ditentukan admin untuk jenis izin ini.'
    WHEN "name" = 'Izin Keluar Asrama'
      THEN 'Isi daftar siswa, Untuk, Hari/tgl, Waktu, dan Tempat. Pengajuan cukup menunggu satu penyetuju yang ditentukan admin untuk jenis izin ini.'
    WHEN "name" = 'Izin Penggunaan HP'
      THEN 'Isi daftar siswa, keperluan Mengambil HP dan memanfaatkan untuk, Hari/tgl, serta Waktu. Pengajuan cukup menunggu satu penyetuju yang ditentukan admin untuk jenis izin ini.'
    WHEN "name" = 'Izin Pulang'
      THEN 'Isi Nama, Kelas, Grha, Hari/Tanggal Kepulangan, Jam Pulang, Hari/Tanggal Kedatangan, Jam Kedatangan, dan Alasan/Keperluan. pengajuan dapat diajukan paling lambat 1 hari sebelum akan melakukan dispensasi. Pengajuan cukup menunggu satu penyetuju yang ditentukan admin untuk jenis izin ini.'
    WHEN "name" = 'Titipan Siswa'
      THEN 'Isi daftar barang 1-10 dengan nama, jumlah, satuan, dan keterangan. Titipan makanan/minuman maksimal sekali per minggu per siswa per grha; uang dan obat wajib dicantumkan pada keterangan.'
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" IN (
  'Dispensasi Kegiatan Asrama',
  'Kunjungan Keluarga',
  'Izin Keluar Asrama',
  'Izin Penggunaan HP',
  'Izin Pulang',
  'Titipan Siswa'
);
