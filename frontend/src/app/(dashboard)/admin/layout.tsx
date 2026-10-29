import React from "react";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="kurikulum">{children}</DashboardShell>;
}
