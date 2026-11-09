import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMapelBadgeClass(mapel: string): string {
  const lower = mapel.toLowerCase();
  if (lower.includes("matematika")) {
    return "bg-blue-100 text-blue-700 border-blue-200";
  }
  if (lower.includes("fisika")) {
    return "bg-green-100 text-green-700 border-green-200";
  }
  if (lower.includes("biologi")) {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }
  if (lower.includes("indonesia") || lower.includes("inggris")) {
    return "bg-rose-100 text-rose-700 border-rose-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export function formatTanggal(iso: string, withTime = false) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

export function inisial(nama: string) {
  return nama
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export function sapaan(date = new Date()) {
  const jam = Number(
    new Intl.DateTimeFormat("id-ID", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(date),
  );
  if (jam < 11) return "Selamat Pagi";
  if (jam < 15) return "Selamat Siang";
  if (jam < 18) return "Selamat Sore";
  return "Selamat Malam";
}

/**
 * Memformat nama guru lengkap beserta gelar akademis secara cerdas tanpa duplikasi
 * Contoh: ("Euis", "S.Pd") -> "Euis, S.Pd"
 *         ("Dr. Siti Aminah, M.Pd", "M.Pd") -> "Dr. Siti Aminah, M.Pd"
 */
export function formatNamaWithGelar(nama: string, gelar?: string): string {
  const cleanName = (nama || "").trim();
  const cleanGelar = (gelar || "").replace(/^,+/, "").trim();
  if (cleanGelar && !cleanName.toLowerCase().includes(cleanGelar.toLowerCase())) {
    return `${cleanName}, ${cleanGelar}`;
  }
  return cleanName;
}

