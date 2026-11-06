'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { AbsensiModule } from '@/components/absensi/AbsensiModule';
import { getKelasGuru, getAbsensiGuru, updateAbsensiSiswaGuru } from '@/services/guruService';
import { Absensi, Kelas, StatusKehadiran } from '@/types/lms';

export default function AbsensiPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [absensiList, setAbsensiList] = useState<Absensi[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAbsensi = useCallback(async (kelasId: string, tanggal: string) => {
    if (!kelasId) return;
    try {
      const data = await getAbsensiGuru(kelasId, tanggal);
      setAbsensiList(data);
    } catch (err) {
      console.warn(err);
      toast.error('Gagal memuat data presensi');
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const kelas = await getKelasGuru();
        setKelasList(kelas);
        if (kelas.length > 0) {
          const firstKelasId = kelas[0].id_kelas;
          setSelectedKelasId(firstKelasId);
          await fetchAbsensi(firstKelasId, selectedDate);
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [fetchAbsensi, selectedDate]);

  const handleKelasChange = async (newKelasId: string) => {
    setSelectedKelasId(newKelasId);
    await fetchAbsensi(newKelasId, selectedDate);
  };

  const handleDateChange = async (newDate: string) => {
    setSelectedDate(newDate);
    if (selectedKelasId) {
      await fetchAbsensi(selectedKelasId, newDate);
    }
  };

  const handleUpdateStatus = async (idAbsen: string, status: StatusKehadiran, keterangan = '') => {
    setAbsensiList((prev) =>
      prev.map((a) => (a.id_absensi === idAbsen ? { ...a, status_kehadiran: status, keterangan } : a))
    );

    try {
      const res = await updateAbsensiSiswaGuru(idAbsen, status, keterangan);
      if (res?.success) {
        toast.success(`Status presensi diperbarui: ${status}`);
      }
    } catch (err) {
      console.warn(err);
      toast.error('Gagal menyimpan perubahan ke server');
    }
  };

  const handleVerifyAbsensi = (kelasId: string) => {
    setAbsensiList((prev) =>
      prev.map((a) => (a.id_kelas === kelasId ? { ...a, diverifikasi_oleh_guru: true } : a))
    );
    toast.success('Presensi harian rombel berhasil diverifikasi oleh guru');
  };

  if (isLoading && kelasList.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Memuat data presensi siswa...
      </div>
    );
  }

  return (
    <AbsensiModule
      absensiList={absensiList}
      kelasList={kelasList}
      initialKelasId={selectedKelasId}
      onKelasChange={handleKelasChange}
      onDateChange={handleDateChange}
      onUpdateStatusKehadiran={handleUpdateStatus}
      onVerifyAbsensi={handleVerifyAbsensi}
    />
  );
}
