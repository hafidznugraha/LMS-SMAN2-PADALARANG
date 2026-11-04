'use client';

import React, { useState } from 'react';
import { MateriModule } from '@/components/materi/MateriModule';
import { UploadMateriModal } from '@/components/modals/UploadMateriModal';
import { INITIAL_MATERI_LIST, KELAS_LIST } from '@/data/mockData';
import { Materi } from '@/types/lms';

export default function MateriPage() {
  const [materiList, setMateriList] = useState<Materi[]>(INITIAL_MATERI_LIST);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Simpan materi baru ke list
  const handleSaveMateri = (newM: Omit<Materi, 'id_materi' | 'tanggal_unggah' | 'unduhan_count'>) => {
    const created: Materi = {
      ...newM,
      id_materi: `mat-${Date.now()}`,
      tanggal_unggah: '2026-11-04 10:00',
      unduhan_count: 0,
    };
    setMateriList([created, ...materiList]);
    alert(`Materi "${created.judul_materi}" berhasil diterbitkan!`);
  };

  // Unduh berkas materi
  const handleDownloadMateri = (materi: Materi) => {
    setMateriList(
      materiList.map((m) =>
        m.id_materi === materi.id_materi
          ? { ...m, unduhan_count: m.unduhan_count + 1 }
          : m
      )
    );
    const element = document.createElement('a');
    const file = new Blob([`Materi: ${materi.judul_materi}\nKelas: ${materi.nama_kelas}\nFormat: ${materi.format_file}\n\n${materi.deskripsi}`], {
      type: 'text/plain',
    });
    element.href = URL.createObjectURL(file);
    element.download = `${materi.judul_materi.replace(/\s+/g, '_')}.${materi.format_file.toLowerCase()}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Edit materi
  const handleEditMateri = (materi: Materi) => {
    const newTitle = prompt('Perbarui Judul Materi:', materi.judul_materi);
    if (newTitle && newTitle.trim()) {
      setMateriList(
        materiList.map((m) =>
          m.id_materi === materi.id_materi ? { ...m, judul_materi: newTitle } : m
        )
      );
    }
  };

  // Hapus materi (Soft Delete)
  const handleDeleteMateri = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus materi ini?')) {
      setMateriList(
        materiList.map((m) =>
          m.id_materi === id ? { ...m, deleted_at: new Date().toISOString() } : m
        )
      );
    }
  };

  return (
    <div>
      <MateriModule
        materiList={materiList}
        kelasList={KELAS_LIST}
        onUploadMateri={() => setIsModalOpen(true)}
        onEditMateri={handleEditMateri}
        onDeleteMateri={handleDeleteMateri}
        onDownloadMateri={handleDownloadMateri}
      />

      <UploadMateriModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        kelasList={KELAS_LIST}
        currentBidangStudi="Matematika Peminatan"
        onSaveMateri={handleSaveMateri}
      />
    </div>
  );
}