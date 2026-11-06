"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import type { APIResponse, Siswa } from "@/types/api";

export function useMeSiswa() {
  return useQuery({
    queryKey: ["siswa", "me"],
    queryFn: async () => {
      const res = await fetchAPI<APIResponse<Siswa>>("/siswa/me");
      return res.data!;
    },
    staleTime: 5 * 60 * 1000,
  });
}