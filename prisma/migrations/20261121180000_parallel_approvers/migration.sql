-- Allow several parallel approvers per permission type and use fixed approver
-- labels (Guru / Staff Pegawai). The first decision resolves the request.

ALTER TABLE "PermissionType"
  ALTER COLUMN "approvalRoles" SET DEFAULT '["PEMBINA","STAFF_ASRAMA"]';

UPDATE "PermissionType"
SET
  "approvalRoles" = '["PEMBINA","STAFF_ASRAMA"]',
  "approvalLabels" = NULL,
  "formGuide" = CASE
    WHEN "name" = 'Dispensasi Kegiatan Asrama'
      THEN 'Isi daftar siswa, Untuk, Hari/tanggal, Waktu, dan Tempat. Pengajuan dapat diputuskan oleh Guru atau Staff Pegawai; keputusan pertama akan menyelesaikan pengajuan.'
    WHEN "name" = 'Kunjungan Keluarga'
      THEN 'Isi Nama, Grha, Hari/Tanggal, Yang Datang, dan Keperluan. Pengajuan dapat diputuskan oleh Guru atau Staff Pegawai; keputusan pertama akan menyelesaikan pengajuan.'
    WHEN "name" = 'Izin Keluar Asrama'
      THEN 'Isi daftar siswa, Untuk, Hari/tgl, Waktu, dan Tempat. Pengajuan dapat diputuskan oleh Guru atau Staff Pegawai; keputusan pertama akan menyelesaikan pengajuan.'
    WHEN "name" = 'Izin Penggunaan HP'
      THEN 'Isi daftar siswa, keperluan Mengambil HP dan memanfaatkan untuk, Hari/tgl, serta Waktu. Pengajuan dapat diputuskan oleh Guru atau Staff Pegawai; keputusan pertama akan menyelesaikan pengajuan.'
    WHEN "name" = 'Izin Pulang'
      THEN 'Isi Nama, Kelas, Grha, Hari/Tanggal Kepulangan, Jam Pulang, Hari/Tanggal Kedatangan, Jam Kedatangan, dan Alasan/Keperluan. Pengajuan dapat diajukan paling lambat 1 hari sebelum akan melakukan dispensasi. Pengajuan dapat diputuskan oleh Guru atau Staff Pegawai; keputusan pertama akan menyelesaikan pengajuan.'
    WHEN "name" = 'Titipan Siswa'
      THEN 'Isi daftar barang 1-10 dengan nama, jumlah, satuan, dan keterangan. Titipan makanan/minuman maksimal sekali per minggu per siswa per grha; uang dan obat wajib dicantumkan pada keterangan. Pengajuan dapat diputuskan oleh Guru atau Staff Pegawai; keputusan pertama akan menyelesaikan pengajuan.'
    ELSE "formGuide"
  END,
  "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "Approval"
SET "label" = CASE
  WHEN "role" = 'PEMBINA' THEN 'Guru'
  WHEN "role" = 'STAFF_ASRAMA' THEN 'Staff Pegawai'
  WHEN "role" = 'KEPALA_ASRAMA' THEN 'Kepala Asrama'
  WHEN "role" = 'WAKASEK_KESISWAAN' THEN 'Wakasek Kesiswaan'
  ELSE "label"
END;
