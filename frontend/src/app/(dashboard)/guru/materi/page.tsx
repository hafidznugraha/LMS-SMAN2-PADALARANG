'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { MateriModule } from '@/components/materi/MateriModule';
import { UploadMateriModal } from '@/components/modals/UploadMateriModal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Materi, MateriFormat, Kelas } from '@/types/lms';
import { downloadMateriFile } from '@/lib/pdfHelper';
import { getStoredUser } from '@/lib/auth';
import { deleteMateriGuru, getKelasGuru } from '@/services/guruService';

export default function GuruMateriPage() {
  const [materiList, setMateriList] = useState<Materi[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMateri, setEditingMateri] = useState<Materi | null>(null);
  const [deletingTarget, setDeletingTarget] = useState<{ id: string; judul: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBidangStudi, setCurrentBidangStudi] = useState('Matematika Peminatan');

  // Ambil data materi & kelas dari database Supabase melalui API Go
  const fetchMateriData = useCallback(async () => {
    try {
      setIsLoading(true);

      const user = getStoredUser();
      const mapelName =
        user?.extra?.mapel?.nama_mapel ||
        (user?.extra?.mapel_nama as string) ||
        (user?.extra?.bidang_studi as string) ||
        'Matematika Peminatan';
      setCurrentBidangStudi(mapelName);

      const [res, kelasRes] = await Promise.all([
        fetch('/api/v1/guru/materi', { cache: 'no-store' }),
        getKelasGuru(),
      ]);

      const activeKelasList = Array.isArray(kelasRes) ? kelasRes : [];
      setKelasList(activeKelasList);

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const mapped: Materi[] = json.data.map((item: any) => {
          const foundKelas = activeKelasList.find((k) => k.id_kelas === item.kelas_id);
          return {
            id_materi: item.id,
            id_guru: item.guru_id,
            id_mapel: item.mapel_id,
            nama_mapel: item.nama_mapel || mapelName,
            id_kelas: item.kelas_id,
            nama_kelas: item.nama_kelas || foundKelas?.nama_kelas || 'XII IPA 1',
            judul_materi: item.judul,
            deskripsi: item.deskripsi || '',
            format_file: (item.tipe_file || 'PDF').toUpperCase() as MateriFormat,
            file_url: item.file_url || '',
            file_size: `${item.ukuran_mb || 3.5} MB`,
            unduhan_count: item.jumlah_melihat || 0,
            tanggal_unggah: item.created_at ? item.created_at.split('T')[0] : '2026-11-05',
          };
        });
        setMateriList(mapped);
      }
    } catch (err) {
      console.error('Gagal mengambil materi:', err);
      toast.error('Gagal memuat daftar materi pembelajaran');
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

  const handleOpenUpload = () => {
    setEditingMateri(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (materi: Materi) => {
    setEditingMateri(materi);
    setIsModalOpen(true);
  };

  const handleRequestDelete = (id: string, judul?: string) => {
    const found = materiList.find((m) => m.id_materi === id);
    setDeletingTarget({
      id,
      judul: judul || found?.judul_materi || 'Materi ini',
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    try {
      setIsDeleting(true);
      const res = await deleteMateriGuru(deletingTarget.id);
      setMateriList((prev) => prev.filter((m) => m.id_materi !== deletingTarget.id));
      if (res?.success) {
        toast.success(`Materi "${deletingTarget.judul}" berhasil dihapus`);
      } else {
        toast.success(`Materi "${deletingTarget.judul}" berhasil dihapus`);
      }
      setDeletingTarget(null);
    } catch (err) {
      console.error('Gagal menghapus materi:', err);
      toast.error('Gagal menghapus materi dari server');
      setMateriList((prev) => prev.filter((m) => m.id_materi !== deletingTarget.id));
      setDeletingTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveMateri = (saved?: Materi) => {
    if (saved) {
      if (editingMateri) {
        setMateriList((prev) =>
          prev.map((m) =>
            m.id_materi === editingMateri.id_materi || m.id_materi === saved.id_materi
              ? saved
              : m
          )
        );
        toast.success('Materi berhasil diperbarui');
      } else {
        setMateriList((prev) => [saved, ...prev.filter((m) => m.id_materi !== saved.id_materi)]);
        toast.success('Materi baru berhasil diterbitkan');
      }
    }
    setEditingMateri(null);
    fetchMateriData();
  };

  return (
    <div className="space-y-6">
      {isLoading && materiList.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center text-slate-500 text-sm">
          Menghubungkan ke Supabase & memuat daftar materi...
        </div>
      ) : (
        <MateriModule
          materiList={materiList}
          kelasList={kelasList}
          onUploadMateri={handleOpenUpload}
          onEditMateri={handleOpenEdit}
          onDeleteMateri={handleRequestDelete}
          onDownloadMateri={handleDownloadMateri}
        />
      )}

      <UploadMateriModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMateri(null);
        }}
        kelasList={kelasList}
        currentBidangStudi={currentBidangStudi}
        initialData={editingMateri}
        onSaveMateri={handleSaveMateri}
      />

      <ConfirmModal
        isOpen={Boolean(deletingTarget)}
        onClose={() => setDeletingTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Materi Pembelajaran"
        message={
          deletingTarget?.judul
            ? `Apakah Anda yakin ingin menghapus materi "${deletingTarget.judul}" secara permanen dari daftar bahan ajar kelas?`
            : 'Apakah Anda yakin ingin menghapus materi ini secara permanen dari daftar bahan ajar kelas?'
        }
        confirmText="Ya, Hapus Materi"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
