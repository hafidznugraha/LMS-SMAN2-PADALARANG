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

  // 1. Ambil data materi dari Supabase via Backend
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
      console.error('Gagal mengambil materi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMateriData();
  }, []);

  // 2. FUNGSI DOWNLOAD NYATA KE KOMPUTER SISWA & GURU
  const handleDownloadMateri = (materi: Materi) => {
    // A. Buat isi konten berkas resmi materi pembelajaran
    const textContent = `=====================================================
SMA NEGERI 2 PADALARANG - BAHAN AJAR DIGITAL LMS
=====================================================
Judul Materi    : ${materi.judul_materi}
Mata Pelajaran  : ${materi.nama_mapel}
Guru Pengampu   : Ibu Irma Satikarama, S.Pd.
Target Kelas    : Kelas ${materi.nama_kelas}
Format Dokumen  : ${materi.format_file} (${materi.file_size})
Tanggal Terbit  : ${materi.tanggal_unggah}
-----------------------------------------------------
PETUNJUK PEMBELAJARAN & DESKRIPSI:
${materi.deskripsi || 'Silakan pelajari bahan ajar ini dengan seksama untuk persiapan asesmen.'}

RANGKUMAN MATERI PEMBELAJARAN:
1. Memahami konsep dasar dan teorema utama.
2. Menganalisis rumus turunan dan sifat-sifat garis singgung fungsi.
3. Mengerjakan latihan soal mandiri pada akhir modul.

=====================================================
Berkas Resmi LMS SMAN 2 Padalarang • Praktikum IPSI
=====================================================`;

    // B. Buat Blob file download
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Nama file saat terunduh di folder Downloads komputer
    const safeName = materi.judul_materi.replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `${safeName}_Materi_SMAN2.txt`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // C. Tambah angka unduhan counter
    setMateriList((prev) =>
      prev.map((m) =>
        m.id_materi === materi.id_materi
          ? { ...m, unduhan_count: (m.unduhan_count || 0) + 1 }
          : m
      )
    );

    alert(`Berkas "${materi.judul_materi}" berhasil diunduh ke komputer Anda!`);
  };

  const handleSaveMateri = () => {
    fetchMateriData();
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
          onDownloadMateri={handleDownloadMateri} // Sambungkan fungsi download ke modul
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