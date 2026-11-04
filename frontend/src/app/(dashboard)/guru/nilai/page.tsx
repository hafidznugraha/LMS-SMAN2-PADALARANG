'use client';

import React, { useState } from 'react';
import { NilaiModule } from '@/components/nilai/NilaiModule';
import { INITIAL_NILAI_LIST, KELAS_LIST } from '@/data/mockData';

export default function NilaiPage() {
  const [nilaiList, setNilaiList] = useState(INITIAL_NILAI_LIST);

  return (
    <NilaiModule
      nilaiList={nilaiList}
      kelasList={KELAS_LIST}
      onUpdateNilai={(u) => setNilaiList(nilaiList.map((n) => (n.id_nilai === u.id_nilai ? u : n)))}
    />
  );
}