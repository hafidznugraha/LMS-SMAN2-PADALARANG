'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { TugasModule } from '@/components/tugas/TugasModule';
import { CreateTugasModal } from '@/components/modals/CreateTugasModal';
import { getStoredUser } from '@/lib/auth';
import {
  getTugasGuru,
  getKelasGuru,
  getTugasSubmissions,
  gradeSubmissionGuru,
} from '@/services/guruService';
import { TugasKuis, PengumpulanTugas, Kelas } from '@/types/lms';

export default function TugasPage() {
  const [tugasList, setTugasList] = useState<TugasKuis[]>([]);
  const [submissionsList, setSubmissionsList] = useState<PengumpulanTugas[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBidangStudi, setCurrentBidangStudi] = useState('Informatika');

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = getStoredUser();
      const mapelName =
        user?.extra?.mapel?.nama_mapel ||
        (user?.extra?.mapel_nama as string) ||
        (user?.extra?.bidang_studi as string) ||
        'Informatika';
      setCurrentBidangStudi(mapelName);

      const [tugasData, kelasData] = await Promise.all([
        getTugasGuru(),
        getKelasGuru(),
      ]);

      setTugasList(tugasData);
      setKelasList(kelasData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleOpenGrading = async (tugas: TugasKuis) => {
    const tugasId = tugas.id_tugas_kuis || (tugas as unknown as { id?: string }).id;
    if (!tugasId) return;

    try {
      const subs = await getTugasSubmissions(tugasId);
      setSubmissionsList(subs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTugas = async (newT: TugasKuis) => {
    setTugasList((prev) => [newT, ...prev]);
    const refreshed = await getTugasGuru();
    if (refreshed.length > 0) {
      setTugasList(refreshed);
    }
  };

  const handleSaveNilai = async (
    idSub: string,
    nilai: number,
    feedback: string,
    sub?: PengumpulanTugas
  ) => {
    try {
      setSubmissionsList((prev) =>
        prev.map((s) => {
          const sId = s.id_pengumpulan || (s as unknown as { id?: string }).id;
          if (sId === idSub) {
            return {
              ...s,
              nilai,
              feedback,
              status_kumpul: s.status_kumpul === 'Belum Mengumpulkan' ? 'Tepat Waktu' : s.status_kumpul,
            };
          }
          return s;
        })
      );

      await gradeSubmissionGuru(idSub, {
        nilai,
        feedback_guru: feedback,
        tugas_id: sub?.id_tugas_kuis || (sub as unknown as { tugas_id?: string })?.tugas_id,
        siswa_id: sub?.id_siswa || (sub as unknown as { siswa_id?: string })?.siswa_id,
      });

      const refreshed = await getTugasGuru();
      if (refreshed.length > 0) {
        setTugasList(refreshed);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#142d72]" />
        <p className="text-sm font-semibold">Memuat Modul Tugas & Penilaian...</p>
      </div>
    );
  }

  return (
    <div>
      <TugasModule
        tugasList={tugasList}
        submissionsList={submissionsList}
        kelasList={kelasList}
        onOpenCreateTugas={() => setIsModalOpen(true)}
        onSaveNilaiSubmission={handleSaveNilai}
        onOpenGrading={handleOpenGrading}
      />

      <CreateTugasModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        kelasList={kelasList}
        currentBidangStudi={currentBidangStudi}
        onSaveTugas={handleSaveTugas}
      />
    </div>
  );
}
