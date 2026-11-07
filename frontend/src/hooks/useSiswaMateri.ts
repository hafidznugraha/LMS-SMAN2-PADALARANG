"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import type { APIResponse, SiswaMateriList } from "@/types/api";

export function useSiswaMateri(search: string, mapelId: string) {
  return useQuery({
    queryKey: ["siswa", "materi", search, mapelId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (mapelId) params.set("mapel_id", mapelId);
      const qs = params.toString();
      const res = await fetchAPI<APIResponse<SiswaMateriList>>(
        `/siswa/materi${qs ? `?${qs}` : ""}`,
      );
      return res.data!;
    },
    placeholderData: keepPreviousData,
  });
}