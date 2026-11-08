'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { NilaiModule } from '@/components/nilai/NilaiModule';
import { getStoredUser } from '@/lib/auth';
import { getKelasGuru, getNilaiGuru, updateNilaiGuru } from '@/services/guruService';
import { NilaiSiswa, Kelas } from '@/types/lms';

export default function NilaiPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [nilaiList, setNilaiList] = useState<NilaiSiswa[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [currentMapelNama, setCurrentMapelNama] = useState<string>('Mata Pelajaran');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchNilai = useCallback(async (kelasId: string) => {
    if (!kelasId) return;
    try {
      const user = getStoredUser();
      const mapelId = (user?.extra?.mapel_id as string) || (user?.extra?.mapel as { id?: string })?.id || '';
      const guruId = (user?.extra?.guru_id as string) || (user?.id as string) || '';

      const data = await getNilaiGuru(kelasId, mapelId, guruId);
      setNilaiList(data);
    } catch (err) {
      console.warn(err);
      toast.error('Gagal memuat buku nilai kelas');
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const user = getStoredUser();
        const mapelName =
          user?.extra?.mapel?.nama_mapel ||
          (user?.extra?.mapel_nama as string) ||
          (user?.extra?.bidang_studi as string) ||
          'Mata Pelajaran';
        setCurrentMapelNama(mapelName);

        const guruId = (user?.extra?.guru_id as string) || (user?.id as string) || '';
        const kelas = await getKelasGuru(guruId);
        setKelasList(kelas);
        if (kelas.length > 0) {
          const firstKelasId = kelas[0].id_kelas;
          setSelectedKelasId(firstKelasId);
          await fetchNilai(firstKelasId);
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [fetchNilai]);

  const handleKelasChange = async (kId: string) => {
    setSelectedKelasId(kId);
    await fetchNilai(kId);
  };

  const handleUpdateNilai = async (updated: NilaiSiswa) => {
    setNilaiList((prev) =>
      prev.map((n) => (n.id_nilai === updated.id_nilai || n.id_siswa === updated.id_siswa ? updated : n))
    );

    try {
      const user = getStoredUser();
      const res = await updateNilaiGuru({
        siswa_id: updated.id_siswa,
        guru_id: (user?.extra?.guru_id as string) || (user?.id as string) || '',
        mapel_id: (user?.extra?.mapel_id as string) || (user?.extra?.mapel as { id?: string })?.id || '',
        nilai_tugas: updated.nilai_tugas,
        nilai_uh: updated.nilai_uh,
        nilai_uts: updated.nilai_uts,
        nilai_uas: updated.nilai_uas,
        feedback: updated.feedback,
      });

      if (res?.success) {
        toast.success(`Nilai ${updated.nama_siswa} berhasil disimpan`);
      }
    } catch (err) {
      console.warn(err);
      toast.error('Gagal menyimpan nilai ke server');
    }
  };

  if (isLoading && kelasList.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Memuat buku nilai akademik...
      </div>
    );
  }

  return (
    <NilaiModule
      nilaiList={nilaiList}
      kelasList={kelasList}
      namaMapel={currentMapelNama}
      onKelasChange={handleKelasChange}
      onUpdateNilai={handleUpdateNilai}
    />
  );
}
