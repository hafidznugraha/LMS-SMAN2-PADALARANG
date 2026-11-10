"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import type { APIResponse, SiswaPengumpulan, SiswaTugas, KomentarTugas } from "@/types/api";

export function useSiswaTugas(mapelId?: string) {
  const queryParam = mapelId ? `?mapel_id=${encodeURIComponent(mapelId)}` : "";
  return useQuery({
    queryKey: ["siswa", "tugas", mapelId ?? "semua"],
    queryFn: async () => {
      const res = await fetchAPI<APIResponse<SiswaTugas[]>>(`/siswa/tugas${queryParam}`);
      return res.data ?? [];
    },
  });
}

export function useSiswaTugasDetail(tugasId: string) {
  return useQuery({
    queryKey: ["siswa", "tugas", "detail", tugasId],
    queryFn: async () => {
      const res = await fetchAPI<APIResponse<SiswaTugas>>(`/siswa/tugas/${encodeURIComponent(tugasId)}`);
      return res.data;
    },
    enabled: !!tugasId,
  });
}

interface SubmitInput {
  tugasId: string;
  submissionId?: string; // diisi bila mengganti jawaban
  file: File | null;
  catatan: string;
}

export function useSubmitTugas() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ tugasId, submissionId, file, catatan }: SubmitInput) => {
      const form = new FormData();
      if (file) form.append("file", file);
      form.append("catatan", catatan);

      const res = submissionId
        ? await fetchAPI<APIResponse<SiswaPengumpulan>>(`/siswa/submissions/${submissionId}`, {
            method: "PUT",
            body: form,
          })
        : await fetchAPI<APIResponse<SiswaPengumpulan>>(`/siswa/tugas/${tugasId}/submit`, {
            method: "POST",
            body: form,
          });
      return res.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["siswa", "tugas"] });
      qc.invalidateQueries({ queryKey: ["siswa", "dashboard"] });
    },
  });
}

export function useKomentarTugas(tugasId: string) {
  return useQuery({
    queryKey: ["tugas", tugasId, "komentar"],
    queryFn: async () => {
      const res = await fetchAPI<APIResponse<KomentarTugas[]>>(`/tugas/${encodeURIComponent(tugasId)}/komentar`);
      return res.data ?? [];
    },
    enabled: !!tugasId,
  });
}

export function useAddKomentarTugas(tugasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pesan: string) => {
      const res = await fetchAPI<APIResponse<KomentarTugas>>(`/tugas/${encodeURIComponent(tugasId)}/komentar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pesan }),
      });
      return res.data!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tugas", tugasId, "komentar"] });
    },
  });
}

export function useDeleteKomentarTugas(tugasId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (komentarId: string) => {
      const res = await fetchAPI<APIResponse<null>>(
        `/tugas/${encodeURIComponent(tugasId)}/komentar/${encodeURIComponent(komentarId)}`,
        {
          method: "DELETE",
        }
      );
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tugas", tugasId, "komentar"] });
    },
  });
}