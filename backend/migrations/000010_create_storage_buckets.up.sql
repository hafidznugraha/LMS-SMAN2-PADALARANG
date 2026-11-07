-- 000010_create_storage_buckets.up.sql
-- Membuat bucket Supabase Storage resmi untuk LMS SMAN 2 Padalarang:
-- 1. materi-pelajaran (Publik untuk distribusi bahan ajar digital PDF, PPT, DOCX, Video MP4)
-- 2. pengumpulan-tugas (Penyimpanan berkas respon jawaban penugasan siswa)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
('materi-pelajaran', 'materi-pelajaran', true, 104857600, null),
('pengumpulan-tugas', 'pengumpulan-tugas', true, 52428800, null)
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Access for materi-pelajaran'
    ) THEN
        CREATE POLICY "Public Access for materi-pelajaran"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'materi-pelajaran');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Insert for materi-pelajaran'
    ) THEN
        CREATE POLICY "Public Insert for materi-pelajaran"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'materi-pelajaran');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Update for materi-pelajaran'
    ) THEN
        CREATE POLICY "Public Update for materi-pelajaran"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'materi-pelajaran');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Delete for materi-pelajaran'
    ) THEN
        CREATE POLICY "Public Delete for materi-pelajaran"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'materi-pelajaran');
    END IF;

    -- Policies untuk pengumpulan-tugas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Access for pengumpulan-tugas'
    ) THEN
        CREATE POLICY "Public Access for pengumpulan-tugas"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'pengumpulan-tugas');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public Insert for pengumpulan-tugas'
    ) THEN
        CREATE POLICY "Public Insert for pengumpulan-tugas"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'pengumpulan-tugas');
    END IF;
END $$;
