'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
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

export default function KuisPage() {
  const [kuisList, setKuisList] = useState<TugasKuis[]>([]);
  const [submissionsList, setSubmissionsList] = useState<PengumpulanTugas[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBidangStudi, setCurrentBidangStudi] = useState('Mata Pelajaran');

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = getStoredUser();
      const guruId = (user?.extra?.guru_id as string) || (user?.id as string) || '';
      const mapelName =
        user?.extra?.mapel?.nama_mapel ||
        (user?.extra?.mapel_nama as string) ||
        (user?.extra?.bidang_studi as string) ||
        'Mata Pelajaran';
      setCurrentBidangStudi(mapelName);

      const [tugasData, kelasData] = await Promise.all([
        getTugasGuru({ guru_id: guruId, jenis: 'Kuis' }),
        getKelasGuru(),
      ]);

      setKuisList(tugasData);
      setKelasList(kelasData);
    } catch (err) {
      console.warn(err);
      toast.error('Gagal memuat data kuis');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenGrading = async (kuis: TugasKuis) => {
    const kuisId = kuis.id_tugas_kuis || (kuis as unknown as { id?: string }).id;
    if (!kuisId) return;

    try {
      const subs = await getTugasSubmissions(kuisId);
      setSubmissionsList(subs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveKuis = async (newK: TugasKuis) => {
    setKuisList((prev) => [newK, ...prev]);
    const refreshed = await getTugasGuru({ jenis: 'Kuis' });
    if (refreshed.length > 0) {
      setKuisList(refreshed);
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
      toast.success('Nilai kuis siswa berhasil disimpan');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan nilai');
    }
  };

  if (isLoading && kuisList.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Memuat data kuis daring...
      </div>
    );
  }

  return (
    <div>
      <TugasModule
        tugasList={kuisList}
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
        onSaveTugas={handleSaveKuis}
      />
    </div>
  );
}
