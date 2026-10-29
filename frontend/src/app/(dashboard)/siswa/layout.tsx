import React from "react";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default function SiswaLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="siswa">{children}</DashboardShell>;
}
