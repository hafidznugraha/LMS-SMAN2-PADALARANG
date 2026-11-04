'use client';

import React, { useState } from 'react';
import { AbsensiModule } from '@/components/absensi/AbsensiModule';
import { INITIAL_ABSENSI_TODAY, KELAS_LIST } from '@/data/mockData';
import { StatusKehadiran } from '@/types/lms';

export default function AbsensiPage() {
  const [absensiList, setAbsensiList] = useState(INITIAL_ABSENSI_TODAY);

  const handleUpdateStatus = (idAbsen: string, status: StatusKehadiran) => {
    setAbsensiList(
      absensiList.map((a) => (a.id_absensi === idAbsen ? { ...a, status_kehadiran: status } : a))
    );
  };

  return (
    <AbsensiModule
      absensiList={absensiList}
      kelasList={KELAS_LIST}
      onUpdateStatusKehadiran={handleUpdateStatus}
      onVerifyAbsensi={(kId) => alert('Presensi harian berhasil diverifikasi guru!')}
    />
  );
}