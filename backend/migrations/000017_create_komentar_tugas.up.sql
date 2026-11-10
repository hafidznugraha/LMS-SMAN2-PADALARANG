-- 000017_create_komentar_tugas.up.sql
-- Membuat tabel komentar_tugas untuk diskusi/komentar kelas pada tugas (Google Classroom style)

CREATE TABLE IF NOT EXISTS komentar_tugas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tugas_id UUID NOT NULL REFERENCES tugas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pesan TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_komentar_tugas_tugas_id ON komentar_tugas(tugas_id);
CREATE INDEX IF NOT EXISTS idx_komentar_tugas_created_at ON komentar_tugas(created_at ASC);
