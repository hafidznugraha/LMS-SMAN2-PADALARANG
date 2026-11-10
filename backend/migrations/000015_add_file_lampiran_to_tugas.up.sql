-- 000015_add_file_lampiran_to_tugas.up.sql
-- Menambahkan kolom file_lampiran pada tabel tugas untuk menyimpan daftar lampiran (Drive, YouTube, File, Link) dalam format JSON
ALTER TABLE tugas ADD COLUMN IF NOT EXISTS file_lampiran TEXT DEFAULT '';
