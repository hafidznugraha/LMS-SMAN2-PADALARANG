INSERT INTO users (id, username, password_hash, nama_lengkap, email, role) VALUES
('a0000000-0000-0000-0000-000000000001', 'kurikulum_herman', '$2a$10$NSRcLGlGHV/lLpX8aoLsYO8zQKOB2Gdd9KLAG.XnZhrJ1lbEL0XXC', 'Drs. Herman Wijaya, M.M', 'herman.wijaya@sman2padalarang.sch.id', 'kurikulum'),
('b0000000-0000-0000-0000-000000000001', 'guru_sitiaminah', '$2a$10$NSRcLGlGHV/lLpX8aoLsYO8zQKOB2Gdd9KLAG.XnZhrJ1lbEL0XXC', 'Dr. Siti Aminah, M.Pd', 'siti.aminah@guru.sman2padalarang.sch.id', 'guru'),
('b0000000-0000-0000-0000-000000000002', 'guru_parhan', '$2a$10$NSRcLGlGHV/lLpX8aoLsYO8zQKOB2Gdd9KLAG.XnZhrJ1lbEL0XXC', 'Parhan Romdhoni, S.Si', 'parhan.romdhoni@guru.sman2padalarang.sch.id', 'guru'),
('c0000000-0000-0000-0000-000000000001', 'wali_budisantoso', '$2a$10$NSRcLGlGHV/lLpX8aoLsYO8zQKOB2Gdd9KLAG.XnZhrJ1lbEL0XXC', 'Budi Santoso, S.Pd', 'budi.santoso@guru.sman2padalarang.sch.id', 'wali_kelas'),
('d0000000-0000-0000-0000-000000000001', 'siswa_laura', '$2a$10$NSRcLGlGHV/lLpX8aoLsYO8zQKOB2Gdd9KLAG.XnZhrJ1lbEL0XXC', 'Laura Firdaus', 'laura.firdaus@siswa.sman2padalarang.sch.id', 'siswa')
ON CONFLICT (id) DO NOTHING;

INSERT INTO guru (id, user_id, nip, gelar, no_telepon) VALUES
('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '198505152010012001', 'Dr., M.Pd', '+628122334455'),
('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', '198809202014021003', 'S.Si', '+628133445566'),
('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', '197903122005011002', 'S.Pd', '+628155667788')
ON CONFLICT (id) DO NOTHING;

INSERT INTO kelas (id, nama_kelas, tingkat, jurusan, wali_guru_id) VALUES
('f0000000-0000-0000-0000-000000000001', 'XII IPA 1', 12, 'MIPA', 'e0000000-0000-0000-0000-000000000003'),
('f0000000-0000-0000-0000-000000000002', 'XII IPA 3', 12, 'MIPA', 'e0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO siswa (id, user_id, nis, nisn, kelas_id, jenis_kelamin, no_telepon, alamat) VALUES
('10000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '24251001', '0067891234', 'f0000000-0000-0000-0000-000000000001', 'Perempuan', '+6281234567890', 'Jl. Cibeber No. 12, Cimahi')
ON CONFLICT (id) DO NOTHING;

INSERT INTO mata_pelajaran (id, kode_mapel, nama_mapel, kategori) VALUES
('20000000-0000-0000-0000-000000000001', 'MTK-XII', 'Matematika Peminatan', 'Eksakta'),
('20000000-0000-0000-0000-000000000002', 'FIS-XII', 'Fisika', 'Eksakta'),
('20000000-0000-0000-0000-000000000003', 'BIO-XII', 'Biologi', 'Eksakta')
ON CONFLICT (id) DO NOTHING;

INSERT INTO jadwal_pelajaran (id, kelas_id, guru_id, mapel_id, hari, jam_mulai, jam_selesai, ruang) VALUES
('30000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Senin', '07:00', '09:00', 'Ruang R.XII-1'),
('30000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Selasa', '07:00', '09:00', 'Ruang Lab Fisika')
ON CONFLICT (id) DO NOTHING;

INSERT INTO materi (id, guru_id, mapel_id, kelas_id, judul, deskripsi, file_url, tipe_file, ukuran_mb) VALUES
('40000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Fungsi Matriks dan Determinan', 'Pembahasan konsep dasar matriks ordo 2x2 dan 3x3', 'https://storage.supabase.co/lms/materi-matriks.pdf', 'PDF', 24.00)
ON CONFLICT (id) DO NOTHING;
