"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import type { APIResponse, SiswaJadwalResponse } from "@/types/api";

export function useSiswaJadwal(hari?: string) {
  const queryParam = hari && hari !== "Semua" ? `?hari=${encodeURIComponent(hari)}` : "";
  return useQuery({
    queryKey: ["siswa", "jadwal", hari ?? "Semua"],
    queryFn: async () => {
      const res = await fetchAPI<APIResponse<SiswaJadwalResponse>>(`/siswa/jadwal${queryParam}`);
      return res.data;
    },
  });
}
