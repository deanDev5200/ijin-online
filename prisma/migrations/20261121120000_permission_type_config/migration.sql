-- Per-type approval flows and form fields, based on Formulir Ijin Asrama.pdf.

ALTER TABLE "PermissionType"
  ADD COLUMN "approvalRoles" TEXT NOT NULL DEFAULT '["PEMBINA","STAFF_ASRAMA","KEPALA_ASRAMA"]',
  ADD COLUMN "requiredFields" TEXT NOT NULL DEFAULT '["purpose","startDate","time"]',
  ADD COLUMN "fieldLabels" TEXT,
  ADD COLUMN "approvalLabels" TEXT,
  ADD COLUMN "formGuide" TEXT;

ALTER TABLE "PermissionRequest"
  ADD COLUMN "visitorName" TEXT,
  ADD COLUMN "phoneUse" TEXT,
  ADD COLUMN "additionalNotes" TEXT;

ALTER TABLE "Approval"
  ADD COLUMN "label" TEXT;

-- Configure the existing default type and add the remaining PDF forms.
UPDATE "PermissionType"
SET
  "approvalRoles" = '["STAFF_ASRAMA","PEMBINA","KEPALA_ASRAMA"]',
  "requiredFields" = '["purpose","startDate","time","place"]',
  "fieldLabels" = '{"purpose":"Untuk (nama kegiatan)","startDate":"Hari / tanggal","time":"Waktu","place":"Tempat"}',
  "approvalLabels" = '{"STAFF_ASRAMA":"Staf Asrama","PEMBINA":"Pembina / Pendamping","KEPALA_ASRAMA":"Kepala Urusan Asrama"}',
  "formGuide" = 'Isi daftar siswa, Untuk, Hari/tanggal, Waktu, dan Tempat. Formulir diketahui Staf Asrama serta Pembina/Pendamping, lalu disetujui Kepala Urusan Asrama.'
WHERE "name" = 'Dispensasi Kegiatan Asrama';

INSERT INTO "PermissionType" (
  "id", "name", "description", "isActive", "sortOrder",
  "approvalRoles", "requiredFields", "fieldLabels", "approvalLabels", "formGuide",
  "createdAt", "updatedAt"
) VALUES
  (
    'pt_kunjungan_keluarga',
    'Kunjungan Keluarga',
    'Izin menerima kunjungan keluarga untuk keperluan pribadi dan pemulihan psikologis siswa.',
    true, 10,
    '["STAFF_ASRAMA","KEPALA_ASRAMA"]',
    '["purpose","startDate","visitorName"]',
    '{"visitorName":"Yang datang","startDate":"Hari / tanggal","purpose":"Keperluan"}',
    '{"STAFF_ASRAMA":"Matta Pitta","KEPALA_ASRAMA":"Kepala Urusan Asrama"}',
    'Isi Nama, Grha, Hari/Tanggal, Yang Datang, dan Keperluan. Formulir diketahui Matta Pitta dan Pemohon/Siswa, lalu disetujui Kepala Urusan Asrama.',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'pt_izin_keluar',
    'Izin Keluar Asrama',
    'Izin keluar asrama atau sekolah untuk kegiatan pengembangan diri siswa.',
    true, 20,
    '["STAFF_ASRAMA","PEMBINA","KEPALA_ASRAMA"]',
    '["purpose","startDate","time","place"]',
    '{"purpose":"Untuk","startDate":"Hari / tanggal","time":"Waktu","place":"Tempat"}',
    '{"STAFF_ASRAMA":"Kubutambahan / Staf Asrama","PEMBINA":"Pembina / Pendamping","KEPALA_ASRAMA":"Kepala Urusan Asrama"}',
    'Isi daftar siswa, Untuk, Hari/tgl, Waktu, dan Tempat. Formulir diketahui Kubutambahan, Staf Asrama, dan Pembina/Pendamping, lalu disetujui Kepala Urusan Asrama.',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'pt_izin_hp',
    'Izin Penggunaan HP',
    'Izin mengambil dan menggunakan HP untuk keperluan yang dinyatakan siswa.',
    true, 30,
    '["PEMBINA","KEPALA_ASRAMA"]',
    '["phoneUse","startDate","time"]',
    '{"phoneUse":"Mengambil HP dan memanfaatkan untuk","startDate":"Hari / tanggal","time":"Waktu"}',
    '{"PEMBINA":"Pembina","KEPALA_ASRAMA":"Kubutambahan / Wakasek Kesiswaan"}',
    'Isi daftar siswa, keperluan Mengambil HP dan memanfaatkan untuk, Hari/tgl, serta Waktu. Formulir diketahui Kubutambahan/Wakasek Kesiswaan dan Pembina.',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'pt_izin_pulang',
    'Izin Pulang',
    'Izin pulang ke rumah dengan tanggal kepulangan dan tanggal kedatangan kembali.',
    true, 40,
    '["PEMBINA","KEPALA_ASRAMA","STAFF_ASRAMA"]',
    '["purpose","startDate","endDate"]',
    '{"startDate":"Hari / tanggal kepulangan","endDate":"Hari / tanggal kedatangan","purpose":"Alasan / keperluan"}',
    '{"PEMBINA":"Yang memberi izin","KEPALA_ASRAMA":"Wakasek Kesiswaan","STAFF_ASRAMA":"Matta Pitta / Kepala Urusan Asrama"}',
    'Isi Nama, Kelas, Grha, Hari/Tanggal Kepulangan, Hari/Tanggal Kedatangan, dan Alasan/Keperluan. Formulir diketahui Wakasek Kesiswaan, Kepala Urusan Asrama, dan Matta Pitta.',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'pt_titipan_siswa',
    'Titipan Siswa',
    'Titipan makanan, minuman, barang, uang, atau obat untuk siswa di asrama.',
    true, 50,
    '["STAFF_ASRAMA","KEPALA_ASRAMA"]',
    '["additionalNotes"]',
    '{"additionalNotes":"Daftar barang, jumlah, satuan, dan keterangan titipan"}',
    '{"STAFF_ASRAMA":"Matta Pitta","KEPALA_ASRAMA":"Kepala Urusan Asrama"}',
    'Tuliskan daftar barang beserta jumlah, satuan, dan keterangannya. Titipan makanan/minuman maksimal sekali per minggu per siswa per grha; uang dan obat wajib diketahui Matta Pitta.',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
ON CONFLICT ("name") DO NOTHING;
