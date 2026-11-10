"use client";

import { useState, useEffect, useCallback } from "react";
import {
  NotifikasiItem,
  getNotifikasiList,
  markNotifikasiRead,
  markAllNotifikasiRead,
} from "@/services/notifikasiService";

export function useNotifikasi(pollIntervalMs = 15000) {
  const [items, setItems] = useState<NotifikasiItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchNotifikasi = useCallback(async () => {
    try {
      const data = await getNotifikasiList();
      setItems(data.items);
      setUnreadCount(data.unread_count);
    } catch {
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchNotifikasi().finally(() => {
      if (isMounted) setIsLoading(false);
    });

    const interval = setInterval(() => {
      fetchNotifikasi();
    }, pollIntervalMs);

    const onFocus = () => fetchNotifikasi();
    const onNotifSync = () => fetchNotifikasi();
    window.addEventListener("focus", onFocus);
    window.addEventListener("lms:sync-notifikasi", onNotifSync);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("lms:sync-notifikasi", onNotifSync);
    };
  }, [fetchNotifikasi, pollIntervalMs]);

  const handleMarkRead = async (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markNotifikasiRead(id);
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);
    await markAllNotifikasiRead();
  };

  return {
    items,
    unreadCount,
    isLoading,
    refetch: fetchNotifikasi,
    markAsRead: handleMarkRead,
    markAllAsRead: handleMarkAllRead,
  };
}
