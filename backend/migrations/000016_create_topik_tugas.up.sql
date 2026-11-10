-- 000016_create_topik_tugas.up.sql
-- Menambahkan tabel topik_tugas dan kolom topik pada tabel tugas ala Google Classroom

CREATE TABLE IF NOT EXISTS topik_tugas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kelas_id UUID NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    mapel_id UUID NOT NULL REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
    guru_id UUID REFERENCES guru(id) ON DELETE SET NULL,
    nama_topik VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_topik_kelas_mapel_nama ON topik_tugas (kelas_id, mapel_id, LOWER(nama_topik));

ALTER TABLE tugas ADD COLUMN IF NOT EXISTS topik VARCHAR(100) DEFAULT '';

-- Backfill topik awal untuk data tugas yang sudah ada agar terstruktur rapi
UPDATE tugas SET topik = 'Tugas Praktikum' WHERE (LOWER(judul) LIKE '%proyek%' OR LOWER(judul) LIKE '%praktikum%') AND (topik IS NULL OR topik = '');
UPDATE tugas SET topik = 'Tugas Terstruktur' WHERE topik IS NULL OR topik = '';

-- Sinkronkan topik awal ke tabel topik_tugas
INSERT INTO topik_tugas (kelas_id, mapel_id, guru_id, nama_topik)
SELECT DISTINCT t.kelas_id, t.mapel_id, t.guru_id, t.topik
FROM tugas t
WHERE t.topik IS NOT NULL AND t.topik != '' AND t.topik != 'Tidak ada topik'
ON CONFLICT DO NOTHING;
