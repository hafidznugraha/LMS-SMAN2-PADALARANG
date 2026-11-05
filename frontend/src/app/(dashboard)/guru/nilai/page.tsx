'use client';

import React, { useState, useEffect } from 'react';
import { NilaiModule } from '@/components/nilai/NilaiModule';
import { KELAS_LIST, INITIAL_NILAI_LIST } from '@/data/mockData';
import { NilaiSiswa } from '@/types/lms';

export default function GuruNilaiPage() {
  const [nilaiList, setNilaiList] = useState<NilaiSiswa[]>(INITIAL_NILAI_LIST);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Ambil data nilai asli dari Supabase via Backend Golang
  const fetchNilaiData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:8080/api/v1/guru/nilai?kelas_id=f0000000-0000-0000-0000-000000000001');
      const json = await res.json();

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setNilaiList(json.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data nilai:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNilaiData();
  }, []);

  // 2. Fungsi saat Guru mengedit skor dan klik "Simpan Penilaian"
  const handleUpdateNilai = async (updated: NilaiSiswa) => {
    // Update tampilan di layar
    setNilaiList((prev) =>
      prev.map((item) => (item.id_siswa === updated.id_siswa ? updated : item))
    );

    // Kirim data ke database Supabase
    try {
      const res = await fetch('http://localhost:8080/api/v1/guru/nilai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siswa_id: updated.id_siswa,
          kelas_id: 'f0000000-0000-0000-0000-000000000001',
          nilai_tugas: updated.nilai_tugas,
          nilai_uh: updated.nilai_uh,
          nilai_uts: updated.nilai_uts,
          nilai_uas: updated.nilai_uas,
          feedback: updated.feedback || 'Pemahaman konsep baik',
        }),
      });

      const json = await res.json();
      console.log('Respon simpan nilai Supabase:', json);
      if (json.success) {
        alert('Sukses! Nilai siswa berhasil disimpan ke tabel nilai di Supabase.');
      }
    } catch (err) {
      console.error('Gagal menyimpan nilai ke backend:', err);
    }
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-sm">
          Menghubungkan ke database Supabase & memuat daftar nilai...
        </div>
      ) : (
        <NilaiModule
          nilaiList={nilaiList}
          kelasList={KELAS_LIST || []}
          onUpdateNilai={handleUpdateNilai}
        />
      )}
    </div>
  );
} 