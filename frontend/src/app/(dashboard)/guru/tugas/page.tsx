'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TugasModule } from '@/components/tugas/TugasModule';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { getStoredUser } from '@/lib/auth';
import {
  getTugasGuru,
  getKelasGuru,
  getTugasSubmissions,
  gradeSubmissionGuru,
  deleteTugasGuru,
} from '@/services/guruService';
import { TugasKuis, PengumpulanTugas, Kelas } from '@/types/lms';

function TugasPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlKelasId = searchParams.get('kelasId');

  const [tugasList, setTugasList] = useState<TugasKuis[]>([]);
  const [submissionsList, setSubmissionsList] = useState<PengumpulanTugas[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBidangStudi, setCurrentBidangStudi] = useState('Informatika');
  const [activeWorkspaceKelas, setActiveWorkspaceKelas] = useState<Kelas | null>(null);
  const [deletingTarget, setDeletingTarget] = useState<{ id: string; judul: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
        getKelasGuru(guruId),
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

  useEffect(() => {
    if (urlKelasId && kelasList.length > 0) {
      const match = kelasList.find((k) => k.id_kelas === urlKelasId);
      if (match) {
        setActiveWorkspaceKelas(match);
      }
    }
  }, [urlKelasId, kelasList]);

  const handleSelectWorkspace = (kelas: Kelas | null) => {
    setActiveWorkspaceKelas(kelas);
    if (kelas) {
      router.replace(`/guru/tugas?kelasId=${kelas.id_kelas}`, { scroll: false });
    } else {
      router.replace('/guru/tugas', { scroll: false });
    }
  };

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

  const handleOpenCreateTugas = (targetKelasId?: string) => {
    const kId =
      targetKelasId ||
      activeWorkspaceKelas?.id_kelas ||
      (kelasList[0]?.id_kelas ?? '');
    router.push(kId ? `/guru/tugas/buat?kelasId=${kId}` : '/guru/tugas/buat');
  };

  const handleEditTugas = (tugas: TugasKuis) => {
    const tugasId =
      tugas.id_tugas_kuis || (tugas as unknown as { id?: string }).id || '';
    const kId = tugas.id_kelas || activeWorkspaceKelas?.id_kelas || '';
    router.push(`/guru/tugas/buat?kelasId=${kId}&editId=${tugasId}`);
  };

  const handleDeleteTugas = (tugasId: string, judul?: string) => {
    if (!tugasId) {
      toast.error('ID tugas tidak valid');
      return;
    }

    setDeletingTarget({
      id: tugasId,
      judul: judul || 'Tugas ini',
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;

    try {
      setIsDeleting(true);
      const res = await deleteTugasGuru(deletingTarget.id);
      if (res?.success) {
        toast.success(`Tugas "${deletingTarget.judul}" berhasil dihapus`);
        setTugasList((prev) =>
          prev.filter(
            (t) =>
              t.id_tugas_kuis !== deletingTarget.id &&
              (t as unknown as { id?: string }).id !== deletingTarget.id
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
    } finally {
      setIsDeleting(false);
      setDeletingTarget(null);
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
        namaMapel={currentBidangStudi}
        activeKelasId={activeWorkspaceKelas?.id_kelas}
        onSelectKelas={handleSelectWorkspace}
        onOpenCreateTugas={handleOpenCreateTugas}
        onEditTugas={handleEditTugas}
        onDeleteTugas={handleDeleteTugas}
        onSaveNilaiSubmission={handleSaveNilai}
        onOpenGrading={handleOpenGrading}
      />

      <ConfirmModal
        isOpen={Boolean(deletingTarget)}
        onClose={() => setDeletingTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Tugas Pembelajaran"
        message={
          deletingTarget?.judul
            ? `Apakah Anda yakin ingin menghapus tugas "${deletingTarget.judul}"? Semua riwayat pengumpulan siswa terkait tugas ini akan ikut terhapus.`
            : 'Apakah Anda yakin ingin menghapus tugas ini? Semua riwayat pengumpulan siswa terkait tugas ini akan ikut terhapus.'
        }
        confirmText="Ya, Hapus Tugas"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default function TugasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#142d72]" />
          <p className="text-sm font-semibold">Memuat Modul Tugas & Penilaian...</p>
        </div>
      }
    >
      <TugasPageContent />
    </Suspense>
  );
}
