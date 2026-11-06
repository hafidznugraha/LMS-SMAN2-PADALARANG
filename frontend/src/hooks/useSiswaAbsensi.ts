"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import type { APIResponse, SiswaAbsensi, SiswaAbsensiRiwayat } from "@/types/api";

export function useSiswaAbsensi(bulan?: string) {
  return useQuery({
    queryKey: ["siswa", "absensi", bulan ?? "sekarang"],
    queryFn: async () => {
      const qs = bulan ? `?bulan=${bulan}` : "";
      const res = await fetchAPI<APIResponse<SiswaAbsensi>>(`/siswa/absensi${qs}`);
      return res.data!;
    },
    placeholderData: keepPreviousData,
  });
}

interface AbsenInput {
  status: "hadir" | "sakit" | "izin";
  catatan: string;
}

export function useAbsenMandiri() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: AbsenInput) => {
      const res = await fetchAPI<APIResponse<SiswaAbsensiRiwayat>>("/siswa/absensi/self", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return res.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["siswa", "absensi"] });
      qc.invalidateQueries({ queryKey: ["siswa", "dashboard"] });
    },
  });
}