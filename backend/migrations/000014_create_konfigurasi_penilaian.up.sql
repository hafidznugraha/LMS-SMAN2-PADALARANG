-- Migration: 000014_create_konfigurasi_penilaian.up.sql
-- Tabel konfigurasi penilaian, KKM acuan, bobot asesmen, dan ambang batas predikat dinamis oleh Kurikulum

CREATE TABLE IF NOT EXISTS konfigurasi_penilaian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kkm_default NUMERIC(5,2) NOT NULL DEFAULT 75.00,
    bobot_tugas NUMERIC(5,2) NOT NULL DEFAULT 30.00,
    bobot_uh NUMERIC(5,2) NOT NULL DEFAULT 20.00,
    bobot_uts NUMERIC(5,2) NOT NULL DEFAULT 25.00,
    bobot_uas NUMERIC(5,2) NOT NULL DEFAULT 25.00,
    batas_predikat_a NUMERIC(5,2) NOT NULL DEFAULT 85.00,
    batas_predikat_b NUMERIC(5,2) NOT NULL DEFAULT 75.00,
    batas_predikat_c NUMERIC(5,2) NOT NULL DEFAULT 65.00,
    is_aktif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_bobot_total CHECK (ROUND(bobot_tugas + bobot_uh + bobot_uts + bobot_uas, 2) = 100.00),
    CONSTRAINT chk_batas_predikat CHECK (batas_predikat_a > batas_predikat_b AND batas_predikat_b > batas_predikat_c)
);

-- Masukkan baris konfigurasi default bila belum ada konfigurasi aktif
INSERT INTO konfigurasi_penilaian (
    kkm_default,
    bobot_tugas,
    bobot_uh,
    bobot_uts,
    bobot_uas,
    batas_predikat_a,
    batas_predikat_b,
    batas_predikat_c,
    is_aktif
)
SELECT 75.00, 30.00, 20.00, 25.00, 25.00, 85.00, 75.00, 65.00, true
WHERE NOT EXISTS (SELECT 1 FROM konfigurasi_penilaian WHERE is_aktif = true);
