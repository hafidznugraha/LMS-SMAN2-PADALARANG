-- Migration: Add format_file to tugas
ALTER TABLE tugas ADD COLUMN IF NOT EXISTS format_file VARCHAR(100) DEFAULT 'pdf, docx';
