'use client';

import React, { useState, useEffect } from 'react';
import { MateriModule } from '@/components/materi/MateriModule';
import { UploadMateriModal } from '@/components/modals/UploadMateriModal';
import { KELAS_LIST } from '@/data/mockData';
import { Materi } from '@/types/lms';

export default function GuruMateriPage() {
  const [materiList, setMateriList] = useState<Materi[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Ambil data asli materi dari Supabase via Backend
  const fetchMateriData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:8080/api/v1/guru/materi');
      const json = await res.json();
      
      if (json.success && Array.isArray(json.data)) {
        const mapped: Materi[] = json.data.map((item: any) => ({
          id_materi: item.id,
          id_guru: item.guru_id,
          id_mapel: item.mapel_id,
          nama_mapel: 'Matematika Peminatan',
          id_kelas: item.kelas_id,
          nama_kelas: 'XII IPA 1',
          judul_materi: item.judul,
          deskripsi: item.deskripsi || '',
          format_file: (item.tipe_file || 'PDF').toUpperCase(),
          file_url: item.file_url || '',
          file_size: `${item.ukuran_mb || 3.5} MB`,
          unduhan_count: item.jumlah_melihat || 0,
          tanggal_unggah: item.created_at ? item.created_at.split('T')[0] : '2026-11-05',
        }));
        setMateriList(mapped);
      }
    } catch (err) {
      console.error('Gagal mengambil materi dari backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMateriData();
  }, []);

  const handleSaveMateri = () => {
    fetchMateriData(); // Refresh data otomatis setelah upload
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center text-slate-500 text-sm">
          Menghubungkan ke Supabase & memuat daftar materi...
        </div>
      ) : (
        <MateriModule
          materiList={materiList}
          kelasList={KELAS_LIST || []}
          onUploadMateri={() => setIsModalOpen(true)}
          onEditMateri={() => {}}
          onDeleteMateri={() => {}}
          onDownloadMateri={() => {}}
        />
      )}

      <UploadMateriModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        kelasList={KELAS_LIST || []}
        currentBidangStudi="Matematika Peminatan"
        onSaveMateri={handleSaveMateri}
      />
    </div>
  );
}