"use client";

import React, { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertConflict } from "@/components/ui/alert-conflict";

export default function KelolaJadwalPage() {
  const [selectedClass] = useState("XII IPA 1");
  const [showConflict] = useState(true);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Kelola Jadwal
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Atur Jadwal Pelajaran Untuk Semua Kelas
          </p>
        </div>
        <Button variant="primary" size="md">
          <Plus className="w-4 h-4" />
          <span>Tambah Jadwal</span>
        </Button>
      </div>

      {showConflict && (
        <AlertConflict
          guru="Dr. Siti Aminah"
          mapelKelas="Matematika - XXI IPA 1 & XII IPA 3"
          waktu="Senin, 07.00 WIB"
          onFix={() => alert("Membuka dialog perbaikan konflik jadwal")}
        />
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Jadwal Kelas {selectedClass}
          </h3>
          <div className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors">
            <span>{selectedClass}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400">
                <th className="py-3 px-3">Jam</th>
                <th className="py-3 px-3">Senin</th>
                <th className="py-3 px-3">Selasa</th>
                <th className="py-3 px-3">Rabu</th>
                <th className="py-3 px-3">Kamis</th>
                <th className="py-3 px-3">Jumat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              <tr>
                <td className="py-3.5 px-3 text-xs text-slate-500 font-medium">07:00 - 09.00</td>
                <td className="py-3.5 px-3">
                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800">
                    Matematika
                  </span>
                </td>
                <td className="py-3.5 px-3">
                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-800">
                    Fisika
                  </span>
                </td>
                <td className="py-3.5 px-3">
                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800">
                    Kimia
                  </span>
                </td>
                <td className="py-3.5 px-3">
                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-800">
                    Biologi
                  </span>
                </td>
                <td className="py-3.5 px-3">
                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800">
                    B. Indonesia
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-3 text-xs text-slate-500 font-medium">09:15 - 11.15</td>
                <td className="py-3.5 px-3">
                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-800">
                    B. Inggris
                  </span>
                </td>
                <td className="py-3.5 px-3">
                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800">
                    Sejarah
                  </span>
                </td>
                <td className="py-3.5 px-3">
                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-800">
                    Geografi
                  </span>
                </td>
                <td className="py-3.5 px-3">
                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800">
                    Matematika
                  </span>
                </td>
                <td className="py-3.5 px-3">
                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-800">
                    PJOK
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
