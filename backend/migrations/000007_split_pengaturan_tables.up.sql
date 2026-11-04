CREATE TABLE IF NOT EXISTS profil_sekolah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_sekolah VARCHAR(150) NOT NULL DEFAULT 'SMA Negeri 2 Padalarang',
    npsn VARCHAR(20) NOT NULL UNIQUE DEFAULT '20227927',
    akreditasi VARCHAR(5) NOT NULL DEFAULT 'A',
    alamat TEXT NOT NULL DEFAULT 'Jalan Raya Padalarang No. 45, Kertajaya, Padalarang, Kabupaten Bandung Barat, Jawa Barat 40553',
    telepon VARCHAR(30) DEFAULT '(022) 6806123',
    email VARCHAR(100) DEFAULT 'info@sman2padalarang.sch.id',
    website VARCHAR(100) DEFAULT 'https://sman2padalarang.sch.id',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tahun_ajaran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tahun VARCHAR(20) NOT NULL,
    semester VARCHAR(10) NOT NULL,
    is_aktif BOOLEAN NOT NULL DEFAULT false,
    tenggat_kunci_raport DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tahun_semester UNIQUE (tahun, semester)
);

CREATE TABLE IF NOT EXISTS pejabat_sekolah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jabatan VARCHAR(50) NOT NULL,
    nama_pejabat VARCHAR(150) NOT NULL,
    nip VARCHAR(30),
    guru_id UUID REFERENCES guru(id) ON DELETE SET NULL,
    periode_mulai DATE NOT NULL DEFAULT CURRENT_DATE,
    periode_selesai DATE,
    is_aktif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS konfigurasi_kbm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    durasi_kbm_menit INT NOT NULL DEFAULT 45,
    jam_masuk TIME NOT NULL DEFAULT '07:00:00',
    jam_pulang TIME NOT NULL DEFAULT '15:30:00',
    is_aktif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS log_sinkron_dapodik (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(50) NOT NULL DEFAULT 'Terhubung',
    keterangan TEXT,
    terakhir_sinkron TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO profil_sekolah (nama_sekolah, npsn, akreditasi, alamat, telepon, email, website)
SELECT nama_sekolah, npsn, akreditasi, alamat, telepon, email, website
FROM pengaturan_sekolah
ON CONFLICT (npsn) DO UPDATE SET
    nama_sekolah = EXCLUDED.nama_sekolah,
    akreditasi = EXCLUDED.akreditasi,
    alamat = EXCLUDED.alamat,
    telepon = EXCLUDED.telepon,
    email = EXCLUDED.email,
    website = EXCLUDED.website;

INSERT INTO tahun_ajaran (tahun, semester, is_aktif, tenggat_kunci_raport)
SELECT tahun_ajaran_aktif, semester_aktif, true, tenggat_kunci_raport
FROM pengaturan_sekolah
ON CONFLICT (tahun, semester) DO UPDATE SET
    is_aktif = EXCLUDED.is_aktif,
    tenggat_kunci_raport = EXCLUDED.tenggat_kunci_raport;

INSERT INTO tahun_ajaran (tahun, semester, is_aktif, tenggat_kunci_raport)
VALUES 
    ('2025/2026', 'Genap', false, '2026-06-20'),
    ('2025/2026', 'Ganjil', false, '2025-12-20'),
    ('2026/2027', 'Genap', false, '2027-06-25')
ON CONFLICT (tahun, semester) DO NOTHING;

INSERT INTO pejabat_sekolah (jabatan, nama_pejabat, nip, is_aktif)
SELECT 'Kepala Sekolah', kepala_sekolah, nip_kepala_sekolah, true
FROM pengaturan_sekolah
WHERE NOT EXISTS (SELECT 1 FROM pejabat_sekolah WHERE jabatan = 'Kepala Sekolah' AND is_aktif = true);

INSERT INTO pejabat_sekolah (jabatan, nama_pejabat, nip, is_aktif)
SELECT 'Waka Kurikulum', waka_kurikulum, nip_waka_kurikulum, true
FROM pengaturan_sekolah
WHERE NOT EXISTS (SELECT 1 FROM pejabat_sekolah WHERE jabatan = 'Waka Kurikulum' AND is_aktif = true);

INSERT INTO konfigurasi_kbm (durasi_kbm_menit, jam_masuk, jam_pulang, is_aktif)
SELECT durasi_kbm_menit, jam_masuk, jam_pulang, true
FROM pengaturan_sekolah
WHERE NOT EXISTS (SELECT 1 FROM konfigurasi_kbm WHERE is_aktif = true);

INSERT INTO log_sinkron_dapodik (status, keterangan, terakhir_sinkron)
SELECT status_sinkronisasi_dapodik, 'Inisialisasi koneksi terverifikasi Kemdikbudristek', terakhir_sinkron
FROM pengaturan_sekolah
LIMIT 1;
