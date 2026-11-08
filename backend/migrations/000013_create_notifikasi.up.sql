-- Migration: Create notifikasi table for in-app student and user notifications
CREATE TABLE IF NOT EXISTS notifikasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    judul VARCHAR(200) NOT NULL,
    pesan TEXT NOT NULL,
    tipe VARCHAR(50) NOT NULL DEFAULT 'materi',
    tautan VARCHAR(255) DEFAULT '/siswa/materi',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifikasi_user_id ON notifikasi(user_id);
CREATE INDEX IF NOT EXISTS idx_notifikasi_user_read_created ON notifikasi(user_id, is_read, created_at DESC);
