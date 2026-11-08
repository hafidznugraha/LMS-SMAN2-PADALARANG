import { fetchAPI } from '@/lib/api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

export interface NotifikasiItem {
  id: string;
  user_id: string;
  judul: string;
  pesan: string;
  tipe: 'materi' | 'tugas' | 'absensi' | 'nilai' | 'sistem' | string;
  tautan?: string;
  is_read: boolean;
  created_at: string;
}

export interface NotifikasiListResponse {
  items: NotifikasiItem[];
  unread_count: number;
}

export async function getNotifikasiList(): Promise<NotifikasiListResponse> {
  try {
    const res = await fetchAPI<ApiResponse<NotifikasiListResponse>>('/notifikasi', {
      method: 'GET',
    });
    if (res?.data) {
      return {
        items: Array.isArray(res.data.items) ? res.data.items : [],
        unread_count: Number(res.data.unread_count) || 0,
      };
    }
  } catch (err) {
    console.warn('[notifikasiService] Gagal memuat notifikasi:', err);
  }

  return { items: [], unread_count: 0 };
}

export async function markNotifikasiRead(id: string): Promise<boolean> {
  try {
    const res = await fetchAPI<ApiResponse<unknown>>(`/notifikasi/${encodeURIComponent(id)}/read`, {
      method: 'PUT',
    });
    return Boolean(res?.success);
  } catch (err) {
    console.error('[notifikasiService] Gagal menandai notifikasi dibaca:', err);
    return false;
  }
}

export async function markAllNotifikasiRead(): Promise<boolean> {
  try {
    const res = await fetchAPI<ApiResponse<unknown>>('/notifikasi/read-all', {
      method: 'PUT',
    });
    return Boolean(res?.success);
  } catch (err) {
    console.error('[notifikasiService] Gagal menandai semua notifikasi dibaca:', err);
    return false;
  }
}
