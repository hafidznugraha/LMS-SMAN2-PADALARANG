ALTER TABLE siswa DROP CONSTRAINT IF EXISTS check_siswa_nisn_numeric;
ALTER TABLE siswa ADD CONSTRAINT check_siswa_nisn_numeric CHECK (nisn ~ '^[0-9]+$');

ALTER TABLE siswa DROP CONSTRAINT IF EXISTS check_siswa_nis_numeric;
ALTER TABLE siswa ADD CONSTRAINT check_siswa_nis_numeric CHECK (nis ~ '^[0-9]+$');

ALTER TABLE guru DROP CONSTRAINT IF EXISTS check_guru_nip_numeric;
ALTER TABLE guru ADD CONSTRAINT check_guru_nip_numeric CHECK (nip ~ '^[0-9]+$');
