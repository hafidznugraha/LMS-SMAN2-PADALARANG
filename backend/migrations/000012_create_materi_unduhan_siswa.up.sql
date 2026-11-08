-- Migration: Track unique siswa downloads for materi pembelajaran
CREATE TABLE IF NOT EXISTS materi_unduhan_siswa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    materi_id UUID NOT NULL REFERENCES materi(id) ON DELETE CASCADE,
    siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_materi_siswa_unduhan UNIQUE (materi_id, siswa_id)
);

CREATE INDEX IF NOT EXISTS idx_materi_unduhan_materi_id ON materi_unduhan_siswa(materi_id);
CREATE INDEX IF NOT EXISTS idx_materi_unduhan_siswa_id ON materi_unduhan_siswa(siswa_id);

-- Sinkronkan data riwayat awal dari siswa kelas masing-masing jika materi sudah memiliki riwayat unduhan
INSERT INTO materi_unduhan_siswa (materi_id, siswa_id, downloaded_at)
SELECT m.id, s.id, NOW()
FROM materi m
JOIN siswa s ON s.kelas_id = m.kelas_id
WHERE m.jumlah_melihat > 0
ON CONFLICT (materi_id, siswa_id) DO NOTHING;

-- Sinkronkan ulang kolom jumlah_melihat pada tabel materi agar tepat merefleksikan jumlah siswa unik
UPDATE materi m
SET jumlah_melihat = COALESCE((
    SELECT COUNT(DISTINCT mus.siswa_id)
    FROM materi_unduhan_siswa mus
    WHERE mus.materi_id = m.id
), 0);
