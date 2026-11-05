'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { MateriModule } from '@/components/materi/MateriModule';
import { UploadMateriModal } from '@/components/modals/UploadMateriModal';
import { getStoredUser } from '@/lib/auth';
import { getMateriGuru, getKelasGuru, deleteMateriGuru } from '@/services/guruService';
import { Materi, Kelas } from '@/types/lms';

export default function MateriPage() {
  const [materiList, setMateriList] = useState<Materi[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBidangStudi, setCurrentBidangStudi] = useState('Mata Pelajaran');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = getStoredUser();
      const mapelName =
        user?.extra?.mapel?.nama_mapel ||
        (user?.extra?.mapel_nama as string) ||
        (user?.extra?.bidang_studi as string) ||
        'Mata Pelajaran';
      setCurrentBidangStudi(mapelName);

      const [materiData, kelasData] = await Promise.all([
        getMateriGuru(),
        getKelasGuru(),
      ]);

      setMateriList(materiData);
      setKelasList(kelasData);
    } catch (err) {
      console.warn(err);
      toast.error('Gagal memuat daftar materi pembelajaran');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveMateri = async (newM: Omit<Materi, 'id_materi' | 'tanggal_unggah' | 'unduhan_count'>) => {
    const refreshed = await getMateriGuru();
    if (refreshed.length > 0) {
      setMateriList(refreshed);
    } else {
      const created: Materi = {
        ...newM,
        id_materi: `mat-${Date.now()}`,
        tanggal_unggah: new Date().toISOString().slice(0, 16).replace('T', ' '),
        unduhan_count: 0,
      };
      setMateriList((prev) => [created, ...prev]);
    }
  };

  const handleDownloadMateri = (materi: Materi) => {
    if (materi.file_url && materi.file_url.startsWith('http')) {
      window.open(materi.file_url, '_blank');
      return;
    }
    const element = document.createElement('a');
    const file = new Blob(
      [`Materi: ${materi.judul_materi}\nKelas: ${materi.nama_kelas}\nFormat: ${materi.format_file}\n\n${materi.deskripsi}`],
      { type: 'text/plain' }
    );
    element.href = URL.createObjectURL(file);
    element.download = `${materi.judul_materi.replace(/\s+/g, '_')}.${(materi.format_file || 'txt').toLowerCase()}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleEditMateri = (materi: Materi) => {
    const newTitle = prompt('Perbarui Judul Materi:', materi.judul_materi);
    if (newTitle && newTitle.trim()) {
      setMateriList((prev) =>
        prev.map((m) =>
          m.id_materi === materi.id_materi ? { ...m, judul_materi: newTitle.trim() } : m
        )
      );
      toast.success('Judul materi berhasil diperbarui');
    }
  };

  const handleDeleteMateri = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus materi ini?')) return;
    try {
      const res = await deleteMateriGuru(id);
      if (res?.success) {
        setMateriList((prev) => prev.filter((m) => m.id_materi !== id));
        toast.success('Materi berhasil dihapus');
      } else {
        toast.error(res?.message || 'Gagal menghapus materi');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat menghapus materi');
    }
  };

  if (isLoading && materiList.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Memuat berkas materi pembelajaran...
      </div>
    );
  }

  return (
    <div>
      <MateriModule
        materiList={materiList}
        kelasList={kelasList}
        onUploadMateri={() => setIsModalOpen(true)}
        onEditMateri={handleEditMateri}
        onDeleteMateri={handleDeleteMateri}
        onDownloadMateri={handleDownloadMateri}
      />

      <UploadMateriModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        kelasList={kelasList}
        currentBidangStudi={currentBidangStudi}
        onSaveMateri={handleSaveMateri}
      />
    </div>
  );
}
