import React from "react";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default function WaliKelasLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="wali_kelas">{children}</DashboardShell>;
}
