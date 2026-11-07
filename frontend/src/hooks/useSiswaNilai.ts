"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import type {
  APIResponse,
  SiswaNilai,
  SiswaRaporDetail,
  SiswaRaporRingkas,
} from "@/types/api";

export function useSiswaNilai() {
  return useQuery({
    queryKey: ["siswa", "nilai"],
    queryFn: async () => {
      const res = await fetchAPI<APIResponse<SiswaNilai>>("/siswa/nilai");
      return res.data!;
    },
  });
}

export function useSiswaRaporList() {
  return useQuery({
    queryKey: ["siswa", "rapor"],
    queryFn: async () => {
      const res = await fetchAPI<APIResponse<SiswaRaporRingkas[]>>("/siswa/rapor");
      return res.data ?? [];
    },
  });
}

export function useSiswaRapor(id: string) {
  return useQuery({
    queryKey: ["siswa", "rapor", id],
    queryFn: async () => {
      const res = await fetchAPI<APIResponse<SiswaRaporDetail>>(`/siswa/rapor/${id}`);
      return res.data!;
    },
    retry: false,
  });
}

export function useUbahPassword() {
  return useMutation({
    mutationFn: async (input: { password_lama: string; password_baru: string }) => {
      await fetchAPI<APIResponse>("/siswa/password", {
        method: "PUT",
        body: JSON.stringify(input),
      });
    },
  });
}