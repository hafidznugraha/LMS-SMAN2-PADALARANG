'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getStoredUser, AuthUser } from '@/lib/auth';
import { fetchAPI } from '@/lib/api';
import { getAbsensiGuru, updateAbsensiSiswaGuru, verifyAbsensiGuru } from '@/services/guruService';
import { Absensi, Kelas, StatusKehadiran } from '@/types/lms';
import { AbsensiModule } from '@/components/absensi/AbsensiModule';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function KehadiranKelasPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [totalSiswa, setTotalSiswa] = useState<number>(0);
  const [absensiList, setAbsensiList] = useState<Absensi[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const isWali = Boolean(
    currentUser?.extra?.is_wali_kelas ||
      (currentUser?.extra?.kelas_binaan && currentUser.extra.kelas_binaan.length > 0) ||
      currentUser?.role === 'wali_kelas'
  );

  const kelasBinaan = currentUser?.extra?.kelas_binaan?.[0];
  const namaKelas = kelasBinaan?.nama_kelas || 'X IPS 2';
  const kelasIdBinaan = kelasBinaan?.id || '';

  const fetchAbsensi = useCallback(async (kelasId: string, tanggal: string) => {
    if (!kelasId) return;
    try {
      const data = await getAbsensiGuru(kelasId, tanggal);
      setAbsensiList(data);
    } catch (err) {
      console.warn('Gagal memuat data presensi:', err);
      toast.error('Gagal memuat data presensi kelas');
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      if (!kelasIdBinaan) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [siswaRes, absData] = await Promise.all([
          fetchAPI<{ success: boolean; data: any[] }>(
            `/master/siswa?kelas_id=${encodeURIComponent(kelasIdBinaan)}`
          ),
          getAbsensiGuru(kelasIdBinaan, selectedDate),
        ]);

        if (siswaRes?.success && Array.isArray(siswaRes.data)) {
          setTotalSiswa(siswaRes.data.length);
        } else {
          setTotalSiswa(absData.length);
        }

        setAbsensiList(absData);
      } catch (err) {
        console.error('Gagal inisialisasi data kehadiran:', err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      initData();
    }
  }, [currentUser, kelasIdBinaan, selectedDate]);

  const handleDateChange = async (newDate: string) => {
    setSelectedDate(newDate);
    if (kelasIdBinaan) {
      await fetchAbsensi(kelasIdBinaan, newDate);
    }
  };

  const handleUpdateStatus = async (
    idAbsen: string,
    status: StatusKehadiran,
    keterangan = '',
    item?: Absensi
  ) => {
    setAbsensiList((prev) =>
      prev.map((a) => (a.id_absensi === idAbsen ? { ...a, status_kehadiran: status, keterangan } : a))
    );

    try {
      const res = await updateAbsensiSiswaGuru(idAbsen, status, keterangan, {
        siswa_id: item?.id_siswa,
        kelas_id: kelasIdBinaan,
        tanggal: selectedDate,
      });

      if (res?.success) {
        toast.success(`Status presensi diperbarui: ${status}`);
      }
    } catch (err) {
      console.warn('Gagal update status absensi:', err);
      toast.error('Gagal menyimpan perubahan ke server');
    }
  };

  const handleVerifyAbsensi = async (kelasId: string, tanggal?: string) => {
    const targetTanggal = tanggal || selectedDate;
    try {
      setIsVerifying(true);
      const res = await verifyAbsensiGuru(kelasId, targetTanggal);
      if (res?.success) {
        setAbsensiList((prev) =>
          prev.map((a) => (a.id_kelas === kelasId ? { ...a, diverifikasi_oleh_guru: true } : a))
        );
        toast.success(`Presensi harian ${namaKelas} berhasil diverifikasi & disimpan ke sistem`);
        await fetchAbsensi(kelasId, targetTanggal);
      } else {
        toast.error(res?.message || 'Gagal memverifikasi presensi');
      }
    } catch (err) {
      console.error('Gagal verifikasi presensi:', err);
      toast.error('Terjadi kesalahan saat memverifikasi presensi');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 gap-2 text-xs">
        <Loader2 className="w-5 h-5 animate-spin text-blue-900" />
        <span>Memuat data pengguna...</span>
      </div>
    );
  }

  if (!isWali || !kelasIdBinaan) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center space-y-4 max-w-lg mx-auto mt-12 shadow-sm">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Akses Khusus Wali Kelas</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Halaman validasi presensi harian ini dikhususkan bagi Pendidik yang mengemban tugas tambahan sebagai
          Wali Kelas untuk memvalidasi rombongan belajar binaannya.
        </p>
        <Link href="/guru">
          <Button variant="primary" size="sm" className="bg-[#142d72] text-white">
            Kembali ke Dashboard Guru
          </Button>
        </Link>
      </div>
    );
  }

  const singleKelasList: Kelas[] = [
    {
      id_kelas: kelasIdBinaan,
      nama_kelas: namaKelas,
      tingkat: kelasBinaan?.tingkat === 10 ? 'X' : kelasBinaan?.tingkat === 11 ? 'XI' : 'XII',
      tahun_ajaran: '2026/2027',
      jumlah_siswa: totalSiswa,
    },
  ];

  if (loading && absensiList.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 gap-2 text-xs">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        <span>Memuat data presensi rombel {namaKelas}...</span>
      </div>
    );
  }

  return (
    <AbsensiModule
      absensiList={absensiList}
      kelasList={singleKelasList}
      initialKelasId={kelasIdBinaan}
      selectedDate={selectedDate}
      isVerifying={isVerifying}
      title={`Kehadiran Kelas Binaan: ${namaKelas}`}
      subtitle={`Validasi kehadiran harian siswa rombel ${namaKelas} terintegrasi secara langsung dengan sistem`}
      showBackButton={true}
      backButtonHref="/wali-kelas"
      backButtonLabel="Kembali ke Ringkasan"
      isLockedToSingleClass={true}
      onDateChange={handleDateChange}
      onUpdateStatusKehadiran={handleUpdateStatus}
      onVerifyAbsensi={handleVerifyAbsensi}
    />
  );
}
