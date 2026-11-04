CREATE TABLE IF NOT EXISTS nilai (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    guru_id UUID NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
    mapel_id UUID NOT NULL REFERENCES mata_pelajaran(id) ON DELETE RESTRICT,
    jenis_penilaian VARCHAR(20) NOT NULL CHECK (jenis_penilaian IN ('Tugas', 'UlanganHarian', 'UTS', 'UAS')),
    skor_angka NUMERIC(5,2) NOT NULL CHECK (skor_angka >= 0 AND skor_angka <= 100),
    skor_huruf CHAR(2),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_nilai_siswa ON nilai (siswa_id);
CREATE INDEX IF NOT EXISTS idx_nilai_mapel ON nilai (mapel_id);

ALTER TABLE laporan_akademik ADD COLUMN IF NOT EXISTS catatan_revisi TEXT;
ALTER TABLE laporan_akademik ADD COLUMN IF NOT EXISTS disahkan_pada TIMESTAMP WITH TIME ZONE;
ALTER TABLE laporan_akademik ADD COLUMN IF NOT EXISTS disahkan_oleh VARCHAR(100);
ALTER TABLE laporan_akademik ADD COLUMN IF NOT EXISTS predikat_akhir VARCHAR(5);
