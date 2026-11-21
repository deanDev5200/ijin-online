-- Add a separate Staff Asrama approver role alongside Staff Pegawai.

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'STAFF_ASRAMA_TAMBAHAN';
