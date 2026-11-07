'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TugasModule } from '@/components/tugas/TugasModule';
import { CreateTugasModal } from '@/components/modals/CreateTugasModal';
import { getStoredUser } from '@/lib/auth';
import {
  getTugasGuru,
  getKelasGuru,
  getTugasSubmissions,
  gradeSubmissionGuru,
  deleteTugasGuru,
} from '@/services/guruService';
import { TugasKuis, PengumpulanTugas, Kelas } from '@/types/lms';

export default function TugasPage() {
  const [tugasList, setTugasList] = useState<TugasKuis[]>([]);
  const [submissionsList, setSubmissionsList] = useState<PengumpulanTugas[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTugasForEdit, setSelectedTugasForEdit] = useState<TugasKuis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBidangStudi, setCurrentBidangStudi] = useState('Informatika');

  const loadInitialData = useCallback(async () => {
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
        getTugasGuru({ guru_id: guruId }),
        getKelasGuru(),
      ]);

      setTugasList(tugasData);
      setKelasList(kelasData);
    } catch (err) {
      console.warn(err);
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

  const handleOpenCreateTugas = () => {
    setSelectedTugasForEdit(null);
    setIsModalOpen(true);
  };

  const handleEditTugas = (tugas: TugasKuis) => {
    setSelectedTugasForEdit(tugas);
    setIsModalOpen(true);
  };

  const handleDeleteTugas = async (tugasId: string, judul?: string) => {
    if (!tugasId) {
      toast.error('ID tugas tidak valid');
      return;
    }

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus tugas "${judul || 'ini'}"?\nSemua riwayat pengumpulan siswa terkait tugas ini akan ikut terhapus.`
    );
    if (!confirmed) return;

    try {
      const res = await deleteTugasGuru(tugasId);
      if (res?.success) {
        toast.success(`Tugas "${judul || ''}" berhasil dihapus dari Supabase`);
        setTugasList((prev) =>
          prev.filter(
            (t) =>
              t.id_tugas_kuis !== tugasId &&
              (t as unknown as { id?: string }).id !== tugasId
          )
        );
        const user = getStoredUser();
        const guruId = (user?.extra?.guru_id as string) || (user?.id as string) || '';
        const refreshed = await getTugasGuru({ guru_id: guruId });
        if (refreshed.length > 0) {
          setTugasList(refreshed);
        }
      } else {
        toast.error(res?.message || 'Gagal menghapus tugas');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat menghapus tugas dari server');
    }
  };

  const handleSaveTugas = async (savedTugas: TugasKuis) => {
    const id = savedTugas.id_tugas_kuis || (savedTugas as unknown as { id?: string }).id;
    setTugasList((prev) => {
      const exists = prev.some(
        (t) =>
          t.id_tugas_kuis === id ||
          (t as unknown as { id?: string }).id === id
      );
      if (exists) {
        return prev.map((t) =>
          t.id_tugas_kuis === id || (t as unknown as { id?: string }).id === id
            ? savedTugas
            : t
        );
      }
      return [savedTugas, ...prev];
    });

    const user = getStoredUser();
    const guruId = (user?.extra?.guru_id as string) || (user?.id as string) || '';
    const refreshed = await getTugasGuru({ guru_id: guruId });
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
              status_kumpul: s.status_kumpul,
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

      const user = getStoredUser();
    const guruId = (user?.extra?.guru_id as string) || (user?.id as string) || '';
    const refreshed = await getTugasGuru({ guru_id: guruId });
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
        onOpenCreateTugas={handleOpenCreateTugas}
        onEditTugas={handleEditTugas}
        onDeleteTugas={handleDeleteTugas}
        onSaveNilaiSubmission={handleSaveNilai}
        onOpenGrading={handleOpenGrading}
      />

      <CreateTugasModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTugasForEdit(null);
        }}
        kelasList={kelasList}
        currentBidangStudi={currentBidangStudi}
        onSaveTugas={handleSaveTugas}
        initialData={selectedTugasForEdit}
      />
    </div>
  );
}
