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
