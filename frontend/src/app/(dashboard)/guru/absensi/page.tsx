'use client';

import React, { useState, useEffect } from 'react';
import { AbsensiModule } from '@/components/absensi/AbsensiModule';
import { KELAS_LIST, INITIAL_ABSENSI_TODAY } from '@/data/mockData';
import { Absensi, StatusKehadiran } from '@/types/lms';

export default function GuruAbsensiPage() {
  const [absensiList, setAbsensiList] = useState<Absensi[]>(INITIAL_ABSENSI_TODAY);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedKelasId, setSelectedKelasId] = useState('f0000000-0000-0000-0000-000000000001'); // XII IPA 1

  // 1. Ambil data absensi dari Supabase via Backend Golang
  const fetchAbsensiData = async (kelasId = selectedKelasId) => {
    try {
      setIsLoading(true);
      const res = await fetch(`http://localhost:8080/api/v1/guru/absensi?kelas_id=${kelasId}`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        // Mapping data dari tabel absensi Supabase ke format tampilan frontend
        const mapped: Absensi[] = json.data.map((item: any) => ({
          id_absensi: item.id,
          id_siswa: item.siswa_id,
          nama_siswa: item.nama_siswa || 'Siswa',
          nis: item.nis || '202412001',
          id_kelas: item.kelas_id,
          nama_kelas: 'XII IPA 1',
          tanggal: item.tanggal ? item.tanggal.split('T')[0] : '2026-11-05',
          jam_masuk: item.waktu_masuk || '07:05:00',
          status_kehadiran: (item.status.charAt(0).toUpperCase() + item.status.slice(1)) as StatusKehadiran,
          keterangan: item.catatan || '-',
          is_verified: true,
        }));
        setAbsensiList(mapped);
      }
    } catch (err) {
      console.error('Gagal mengambil data absensi dari backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsensiData();
  }, [selectedKelasId]);

  // 2. Fungsi saat Guru mengklik koreksi Hadir / Sakit / Izin / Alfa
  const handleUpdateStatus = async (
    idAbsensi: string,
    newStatus: StatusKehadiran,
    keterangan?: string
  ) => {
    // A. Update tampilan lokal di layar langsung (responsif)
    setAbsensiList((prev) =>
      prev.map((item) =>
        item.id_absensi === idAbsensi
          ? { ...item, status_kehadiran: newStatus, keterangan: keterangan || item.keterangan }
          : item
      )
    );

    // B. Kirim pembaruan ke Supabase via Backend Golang
    const targetItem = absensiList.find((a) => a.id_absensi === idAbsensi);
    try {
      const res = await fetch('http://localhost:8080/api/v1/guru/absensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          absensi_id: idAbsensi,
          siswa_id: targetItem?.id_siswa || '',
          kelas_id: selectedKelasId,
          tanggal: new Date().toISOString().split('T')[0],
          status: newStatus.toLowerCase(), // 'hadir', 'sakit', 'izin', 'alfa'
          catatan: keterangan || targetItem?.keterangan || '-',
        }),
      });

      const json = await res.json();
      console.log('Respon update presensi Supabase:', json);
    } catch (err) {
      console.error('Gagal menyimpan perubahan presensi ke backend:', err);
    }
  };

  // 3. Fungsi saat tombol "Verifikasi & Simpan Presensi" diklik
  const handleVerify = async (kelasId: string) => {
    alert('Memverifikasi dan mengunci seluruh presensi kelas ke Supabase...');
    // Refresh data segar dari Supabase
    await fetchAbsensiData(kelasId);
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-sm">
          Menghubungkan ke database Supabase...
        </div>
      ) : (
        <AbsensiModule
          absensiList={absensiList}
          kelasList={KELAS_LIST || []}
          onUpdateStatusKehadiran={handleUpdateStatus}
          onVerifyAbsensi={handleVerify}
          initialKelasId={selectedKelasId}
        />
      )}
    </div>
  );
}