"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import type { APIResponse, SiswaPengumpulan, SiswaTugas } from "@/types/api";

export function useSiswaTugas() {
  return useQuery({
    queryKey: ["siswa", "tugas"],
    queryFn: async () => {
      const res = await fetchAPI<APIResponse<SiswaTugas[]>>("/siswa/tugas");
      return res.data ?? [];
    },
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