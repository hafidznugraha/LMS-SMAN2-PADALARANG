-- Seed data absensi harian siswa lintas rombel (SMAN 2 Padalarang)
INSERT INTO absensi (id, siswa_id, kelas_id, tanggal, waktu_masuk, status, catatan)
SELECT 
    gen_random_uuid(),
    s.id,
    s.kelas_id,
    d.tgl::date,
    CASE 
        WHEN u.nama_lengkap = 'Alexa demian' AND d.tgl::date < '2026-11-04'::date THEN NULL
        WHEN u.nama_lengkap = 'karina jean' AND d.tgl::date IN ('2026-11-02'::date, '2026-11-03'::date) THEN NULL
        WHEN u.nama_lengkap = 'Ahmad Fikri Ramadhan' AND d.tgl::date = '2026-11-04'::date THEN NULL
        WHEN u.nama_lengkap = 'Laura Firdaus' AND d.tgl::date = '2026-11-04'::date THEN '07:15:00'::time
        ELSE '06:50:00'::time
    END,
    CASE 
        WHEN u.nama_lengkap = 'Alexa demian' AND d.tgl::date < '2026-11-04'::date THEN 'alpa'
        WHEN u.nama_lengkap = 'karina jean' AND d.tgl::date IN ('2026-11-02'::date, '2026-11-03'::date) THEN 'sakit'
        WHEN u.nama_lengkap = 'Ahmad Fikri Ramadhan' AND d.tgl::date = '2026-11-04'::date THEN 'izin'
        WHEN u.nama_lengkap = 'Laura Firdaus' AND d.tgl::date = '2026-11-04'::date THEN 'terlambat'
        ELSE 'hadir'
    END,
    CASE 
        WHEN u.nama_lengkap = 'Alexa demian' AND d.tgl::date < '2026-11-04'::date THEN 'Tanpa keterangan (Perlu pembinaan)'
        WHEN u.nama_lengkap = 'karina jean' AND d.tgl::date IN ('2026-11-02'::date, '2026-11-03'::date) THEN 'Surat dokter terlampir'
        WHEN u.nama_lengkap = 'Ahmad Fikri Ramadhan' AND d.tgl::date = '2026-11-04'::date THEN 'Acara keluarga (ada surat)'
        WHEN u.nama_lengkap = 'Laura Firdaus' AND d.tgl::date = '2026-11-04'::date THEN 'Kendala kemacetan Padalarang'
        ELSE 'Tepat waktu'
    END
FROM siswa s
JOIN users u ON s.user_id = u.id
CROSS JOIN (
    VALUES ('2026-11-01'), ('2026-11-02'), ('2026-11-03'), ('2026-11-04')
) AS d(tgl)
WHERE s.kelas_id IS NOT NULL
ON CONFLICT (siswa_id, tanggal) DO UPDATE SET
    kelas_id = EXCLUDED.kelas_id,
    status = EXCLUDED.status,
    waktu_masuk = EXCLUDED.waktu_masuk,
    catatan = EXCLUDED.catatan;
