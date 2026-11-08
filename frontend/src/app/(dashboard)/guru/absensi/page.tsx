'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStoredUser, AuthUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ShieldAlert, BookOpen, ClipboardList, Award, ArrowLeft, Loader2 } from 'lucide-react';

export default function GuruAbsensiRedirectPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
      const isWali = Boolean(
        user.extra?.is_wali_kelas ||
          (user.extra?.kelas_binaan && user.extra.kelas_binaan.length > 0) ||
          user.role === 'wali_kelas'
      );
      if (isWali) {
        router.replace('/wali-kelas/kehadiran');
        return;
      }
    }
    setIsChecking(false);
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#142d72]" />
        <p className="text-sm font-semibold">Memverifikasi wewenang akun...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm text-center space-y-5">
        <div className="w-14 h-14 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Validasi Presensi Khusus Wali Kelas
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-lg mx-auto">
            Sistem Presensi SMAN 2 Padalarang menggunakan mekanisme <strong>Presensi Harian Terpusat</strong> (1 sesi per hari sekolah). Hak validasi serta koreksi kehadiran siswa berada di bawah wewenang penuh <strong>Wali Kelas</strong> untuk rombongan belajar binaannya.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs text-slate-600 space-y-1.5">
          <p className="font-semibold text-slate-800">Sebagai Guru Mata Pelajaran, Anda dapat mengakses:</p>
          <ul className="list-disc pl-4 space-y-1 text-slate-600">
            <li>Bahan ajar dan distribusi materi untuk kelas yang Anda ajar.</li>
            <li>Pembuatan dan evaluasi penugasan/kuis siswa.</li>
            <li>Penginputan nilai capaian siswa (Tugas, UH, UTS, UAS) untuk dikirim ke buku rapor.</li>
          </ul>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link href="/guru">
            <Button variant="primary" size="sm" className="gap-1.5 bg-[#142d72] text-white hover:bg-blue-900">
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Dashboard Guru</span>
            </Button>
          </Link>

          <Link href="/guru/materi">
            <Button variant="secondary" size="sm" className="gap-1.5 border-slate-300">
              <BookOpen className="w-4 h-4" />
              <span>Kelola Materi</span>
            </Button>
          </Link>

          <Link href="/guru/tugas">
            <Button variant="secondary" size="sm" className="gap-1.5 border-slate-300">
              <ClipboardList className="w-4 h-4" />
              <span>Kelola Tugas</span>
            </Button>
          </Link>

          <Link href="/guru/nilai">
            <Button variant="secondary" size="sm" className="gap-1.5 border-slate-300">
              <Award className="w-4 h-4" />
              <span>Kelola Nilai</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
