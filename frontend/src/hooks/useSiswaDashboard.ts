"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import type { APIResponse, SiswaDashboard } from "@/types/api";

export function useSiswaDashboard() {
  return useQuery({
    queryKey: ["siswa", "dashboard"],
    queryFn: async () => {
      const res = await fetchAPI<APIResponse<SiswaDashboard>>("/siswa/dashboard");
      return res.data!;
    },
  });
}