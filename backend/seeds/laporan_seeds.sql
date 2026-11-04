-- Users for additional students if not exist
INSERT INTO users (id, username, password_hash, nama_lengkap, email, role) VALUES
('d0000000-0000-0000-0000-000000000002', 'siswa_ahmadfikri', '$2a$10$NSRcLGlGHV/lLpX8aoLsYO8zQKOB2Gdd9KLAG.XnZhrJ1lbEL0XXC', 'Ahmad Fikri Ramadhan', 'ahmad.fikri@siswa.sman2padalarang.sch.id', 'siswa'),
('d0000000-0000-0000-0000-000000000003', 'siswa_nabilaputri', '$2a$10$NSRcLGlGHV/lLpX8aoLsYO8zQKOB2Gdd9KLAG.XnZhrJ1lbEL0XXC', 'Nabila Putri Salsabila', 'nabila.putri@siswa.sman2padalarang.sch.id', 'siswa'),
('d0000000-0000-0000-0000-000000000004', 'siswa_dimasraya', '$2a$10$NSRcLGlGHV/lLpX8aoLsYO8zQKOB2Gdd9KLAG.XnZhrJ1lbEL0XXC', 'Dimas Raya Pratama', 'dimas.raya@siswa.sman2padalarang.sch.id', 'siswa')
ON CONFLICT (id) DO NOTHING;

-- Siswa records
INSERT INTO siswa (id, user_id, nis, nisn, kelas_id, jenis_kelamin, no_telepon, alamat) VALUES
('10000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', '24251020', '0067891235', 'f0000000-0000-0000-0000-000000000001', 'Laki-laki', '+6281234567891', 'Jl. Raya Padalarang No. 45'),
('10000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', '24251021', '0067891236', 'f0000000-0000-0000-0000-000000000002', 'Perempuan', '+6281234567892', 'Jl. Kertajaya No. 8'),
('10000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', '24251022', '0067891237', 'f0000000-0000-0000-0000-000000000002', 'Laki-laki', '+6281234567893', 'Jl. Panaris No. 19')
ON CONFLICT (id) DO NOTHING;

-- Update kelas_id of karina jean to XII IPA 1 if needed
UPDATE siswa SET kelas_id = 'f0000000-0000-0000-0000-000000000001' WHERE id = '59a387a5-3d69-46b8-a6e0-1c3c7a0f1245';

-- Insert Nilai
INSERT INTO nilai (id, siswa_id, guru_id, mapel_id, jenis_penilaian, skor_angka, skor_huruf, feedback) VALUES
-- Laura Firdaus (10000000-0000-0000-0000-000000000001)
('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Tugas', 90.00, 'A', 'Penyelesaian soal matriks sangat tepat'),
('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'UAS', 88.00, 'A', 'Pemahaman kalkulus diferensial sangat memuaskan'),
('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Tugas', 89.00, 'A', 'Laporan praktikum rangkaian RLC sangat rapi'),
('50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'UAS', 88.00, 'A', 'Analisis genetika seluler akurat'),

-- Ahmad Fikri Ramadhan (10000000-0000-0000-0000-000000000002)
('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Tugas', 85.00, 'B', 'Logika matematika baik, tingkatkan ketelitian'),
('50000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'UAS', 84.00, 'B', 'Hasil ujian teori fisika konsisten'),
('50000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Tugas', 86.00, 'B', 'Pengamatan biologi tuntas sesuai KKM'),

-- Nabila Putri Salsabila (10000000-0000-0000-0000-000000000003)
('50000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'UAS', 92.00, 'A', 'Sangat menguasai materi kalkulus'),
('50000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'UAS', 90.00, 'A', 'Praktik fisika eksperimental unggul'),

-- Dimas Raya Pratama (10000000-0000-0000-0000-000000000004)
('50000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'UAS', 88.00, 'A', 'Disiplin dan teliti menyelesaikan latihan'),
('50000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'UAS', 89.00, 'A', 'Proyek biologi tersaji sangat baik')
ON CONFLICT (id) DO NOTHING;

-- Insert Laporan Akademik
INSERT INTO laporan_akademik (
    id_laporan, id_siswa, semester, tahun_ajaran,
    nilai_pengetahuan, nilai_keterampilan, rata_rata_akhir, predikat_akhir,
    deskripsi_nilai, catatan_wali, status_laporan, disahkan_pada, disahkan_oleh
) VALUES
-- Laura Firdaus (XII IPA 1) - Menunggu Kurikulum (DitinjauWali)
(
    '60000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Ganjil', '2026/2027',
    88.50, 89.00, 88.75, 'A',
    'Memiliki penguasaan materi sangat baik pada seluruh mata pelajaran peminatan MIPA.',
    'Menunjukkan dedikasi tinggi, konsisten hadir tepat waktu, dan aktif memimpin kelompok diskusi.',
    'DitinjauWali', NULL, NULL
),
-- Ahmad Fikri Ramadhan (XII IPA 1) - Menunggu Kurikulum (DitinjauWali)
(
    '60000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'Ganjil', '2026/2027',
    84.00, 86.00, 85.00, 'B',
    'Mencapai ketuntasan kompetensi dengan performa stabil pada penilaian tugas dan ujian.',
    'Rajin berdiskusi di kelas, pertahankan antusiasme dan ketelitian dalam pengerjaan tugas eksakta.',
    'DitinjauWali', NULL, NULL
),
-- Karina Jean (XII IPA 1) - Perlu Revisi / Draf
(
    '60000000-0000-0000-0000-000000000003',
    '59a387a5-3d69-46b8-a6e0-1c3c7a0f1245',
    'Ganjil', '2026/2027',
    81.00, 83.00, 82.00, 'B',
    'Kompetensi dasar tercapai, terdapat satu tugas Biologi yang memerlukan perbaikan rubrik.',
    'Tingkatkan kehadiran pada sesi praktikum laboratorium di semester berikutnya.',
    'Draf', NULL, NULL
),
-- Nabila Putri Salsabila (XII IPA 3) - DisahkanKurikulum
(
    '60000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000003',
    'Ganjil', '2026/2027',
    91.00, 91.50, 91.25, 'A',
    'Unggul dalam analisis kuantitatif dan penalaran sains secara komprehensif.',
    'Prestasi akademik cemerlang dan memiliki integritas belajar yang sangat baik.',
    'DisahkanKurikulum', '2026-11-04 10:00:00+07', 'Drs. Herman Wijaya, M.M'
),
-- Dimas Raya Pratama (XII IPA 3) - DisahkanKurikulum
(
    '60000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000004',
    'Ganjil', '2026/2027',
    87.50, 88.50, 88.00, 'A',
    'Tuntas pada seluruh capaian pembelajaran dengan keunggulan pada bidang kognitif.',
    'Pertahankan etos belajar yang konsisten dan aktif berkontribusi positif.',
    'DisahkanKurikulum', '2026-11-04 10:00:00+07', 'Drs. Herman Wijaya, M.M'
)
ON CONFLICT (id_laporan) DO NOTHING;
