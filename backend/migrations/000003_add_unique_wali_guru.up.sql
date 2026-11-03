ALTER TABLE kelas DROP CONSTRAINT IF EXISTS uq_kelas_wali_guru;
ALTER TABLE kelas ADD CONSTRAINT uq_kelas_wali_guru UNIQUE (wali_guru_id);
