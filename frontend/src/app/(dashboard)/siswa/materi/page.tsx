'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MateriModule } from '@/components/materi/MateriModule';
import { Materi, MateriFormat, Kelas } from '@/types/lms';
import { downloadMateriFile } from '@/lib/pdfHelper';
import { getKelasGuru } from '@/services/guruService';

const DEFAULT_KELAS: Kelas[] = [
  { id_kelas: 'f0000000-0000-0000-0000-000000000001', nama_kelas: 'XII IPA 1', tingkat: 'XII', tahun_ajaran: '2026/2027', jumlah_siswa: 36 },
  { id_kelas: 'f0000000-0000-0000-0000-000000000002', nama_kelas: 'XII IPA 2', tingkat: 'XII', tahun_ajaran: '2026/2027', jumlah_siswa: 35 },
  { id_kelas: 'f0000000-0000-0000-0000-000000000003', nama_kelas: 'XII IPA 3', tingkat: 'XII', tahun_ajaran: '2026/2027', jumlah_siswa: 36 },
];

export default function SiswaMateriPage() {
  const [materiList, setMateriList] = useState<Materi[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>(DEFAULT_KELAS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMateriData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [res, kelasRes] = await Promise.all([
        fetch('/api/v1/guru/materi', { cache: 'no-store' }),
        getKelasGuru(),
      ]);

      const activeKelasList = kelasRes && kelasRes.length > 0 ? kelasRes : DEFAULT_KELAS;
      if (kelasRes && kelasRes.length > 0) {
        setKelasList(kelasRes);
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const mapped: Materi[] = json.data.map((item: any) => {
          const foundKelas = activeKelasList.find((k: Kelas) => k.id_kelas === item.kelas_id || k.id_kelas === item.id_kelas);
          return {
            id_materi: item.id || item.id_materi,
            id_guru: item.guru_id || item.id_guru,
            id_mapel: item.mapel_id || item.id_mapel,
            nama_mapel: item.nama_mapel || 'Matematika Peminatan',
            id_kelas: item.kelas_id || item.id_kelas,
            nama_kelas: item.nama_kelas || foundKelas?.nama_kelas || 'XII IPA 1',
            judul_materi: item.judul || item.judul_materi,
            deskripsi: item.deskripsi || '',
            format_file: (item.tipe_file || item.format_file || 'PDF').toUpperCase() as MateriFormat,
            file_url: item.file_url || '',
            file_size: `${item.ukuran_mb || 3.5} MB`,
            unduhan_count: item.jumlah_melihat || item.unduhan_count || 0,
            tanggal_unggah: item.tanggal_unggah || (item.created_at ? item.created_at.split('T')[0] : '2026-11-05'),
          };
        });
        setMateriList(mapped);
      }
    } catch (err) {
      console.error('Gagal mengambil materi siswa:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMateriData();
  }, [fetchMateriData]);

  const handleDownloadMateri = async (materi: Materi) => {
    setMateriList((prev) =>
      prev.map((m) =>
        m.id_materi === materi.id_materi
          ? { ...m, unduhan_count: (m.unduhan_count || 0) + 1 }
          : m
      )
    );
    await downloadMateriFile(materi);
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center text-slate-500 text-sm">
          Memuat daftar bahan ajar dari server...
        </div>
      ) : (
        <MateriModule
          materiList={materiList}
          kelasList={kelasList}
          readOnly
          onDownloadMateri={handleDownloadMateri}
        />
      )}
    </div>
  );
}
