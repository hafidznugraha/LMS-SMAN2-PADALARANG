'use client';

import React, { useState } from 'react';
import { TugasModule } from '@/components/tugas/TugasModule';
import { CreateTugasModal } from '@/components/modals/CreateTugasModal';
import { INITIAL_TUGAS_LIST, INITIAL_SUBMISSIONS, KELAS_LIST } from '@/data/mockData';
import { TugasKuis } from '@/types/lms';

export default function KuisPage() {
  // Hanya menampilkan data yang berjenis 'Kuis'
  const [kuisList, setKuisList] = useState<TugasKuis[]>(() => {
    const onlyKuis = INITIAL_TUGAS_LIST.filter((t) => t.jenis === 'Kuis');
    // Jika data kuis baru ada 1, kita tambahkan 2 kuis aktif lagi agar pas dengan angka "3 Kuis Aktif" di dashboard!
    if (onlyKuis.length === 1) {
      return [
        ...onlyKuis,
        {
          id_tugas_kuis: 'kuis-02',
          id_guru: 'guru-irma-01',
          id_mapel: 'mapel-mat-pem',
          nama_mapel: 'Matematika Peminatan',
          id_kelas: 'f0000000-0000-0000-0000-000000000001',
          nama_kelas: 'XII IPA 1',
          judul: 'Kuis Singkat: Aturan Cramer & SPLTV Tiga Variabel',
          instruksi: '10 butir soal interaktif evaluasi bab matriks ordo 3x3.',
          jenis: 'Kuis',
          tenggat_waktu: '2026-11-06 15:00',
          format_file: 'online form',
          rubrik_penilaian: 'Setiap soal benar bernilai 10 poin (Total 100).',
          total_siswa: 32,
          jumlah_mengumpulkan: 29,
          jumlah_dinilai: 29,
        },
        {
          id_tugas_kuis: 'kuis-03',
          id_guru: 'guru-irma-01',
          id_mapel: 'mapel-mat-pem',
          nama_mapel: 'Matematika Peminatan',
          id_kelas: 'f0000000-0000-0000-0000-000000000002',
          nama_kelas: 'XII IPA 3',
          judul: 'Uji Pemahaman: Limit Fungsi Aljabar Mendekati Tak Hingga',
          instruksi: 'Pengerjaan kuis berbatas waktu 30 menit sesi KBM.',
          jenis: 'Kuis',
          tenggat_waktu: '2026-11-04 18:00',
          format_file: 'online form',
          rubrik_penilaian: 'Otomatis tersinkronisasi ke buku nilai harian.',
          total_siswa: 30,
          jumlah_mengumpulkan: 25,
          jumlah_dinilai: 25,
        },
      ];
    }
    return onlyKuis;
  });

  const [submissionsList, setSubmissionsList] = useState(INITIAL_SUBMISSIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Buat kuis baru
  const handleSaveKuis = (newK: Omit<TugasKuis, 'id_tugas_kuis' | 'total_siswa' | 'jumlah_mengumpulkan' | 'jumlah_dinilai'>) => {
    const created: TugasKuis = {
      ...newK,
      id_tugas_kuis: `kuis-${Date.now()}`,
      jenis: 'Kuis',
      total_siswa: 32,
      jumlah_mengumpulkan: 0,
      jumlah_dinilai: 0,
    };
    setKuisList([created, ...kuisList]);
    alert(`Kuis "${created.judul}" berhasil diterbitkan!`);
  };

  const handleSaveNilai = (idSub: string, nilai: number, feedback: string) => {
    setSubmissionsList(
      submissionsList.map((s) => (s.id_pengumpulan === idSub ? { ...s, nilai, feedback } : s))
    );
  };

  return (
    <div>
      <TugasModule
        tugasList={kuisList}
        submissionsList={submissionsList}
        kelasList={KELAS_LIST}
        onOpenCreateTugas={() => setIsModalOpen(true)}
        onSaveNilaiSubmission={handleSaveNilai}
      />

      <CreateTugasModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        kelasList={KELAS_LIST}
        currentBidangStudi="Matematika Peminatan"
        onSaveTugas={handleSaveKuis}
      />
    </div>
  );
}