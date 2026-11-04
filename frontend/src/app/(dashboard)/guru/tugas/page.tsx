'use client';

import React, { useState } from 'react';
import { TugasModule } from '@/components/tugas/TugasModule';
import { CreateTugasModal } from '@/components/modals/CreateTugasModal';
import { INITIAL_TUGAS_LIST, INITIAL_SUBMISSIONS, KELAS_LIST } from '@/data/mockData';
import { TugasKuis } from '@/types/lms';

export default function TugasPage() {
  const [tugasList, setTugasList] = useState(INITIAL_TUGAS_LIST);
  const [submissionsList, setSubmissionsList] = useState(INITIAL_SUBMISSIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveTugas = (newT: Omit<TugasKuis, 'id_tugas_kuis' | 'total_siswa' | 'jumlah_mengumpulkan' | 'jumlah_dinilai'>) => {
    const created: TugasKuis = {
      ...newT,
      id_tugas_kuis: `tugas-${Date.now()}`,
      total_siswa: 32,
      jumlah_mengumpulkan: 0,
      jumlah_dinilai: 0,
    };
    setTugasList([created, ...tugasList]);
  };

  const handleSaveNilai = (idSub: string, nilai: number, feedback: string) => {
    setSubmissionsList(
      submissionsList.map((s) => (s.id_pengumpulan === idSub ? { ...s, nilai, feedback } : s))
    );
  };

  return (
    <div>
      <TugasModule
        tugasList={tugasList}
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
        onSaveTugas={handleSaveTugas}
      />
    </div>
  );
}