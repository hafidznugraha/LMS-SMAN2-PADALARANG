import React from "react";
import { DashboardShell } from "@/components/shared/dashboard-shell";

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="guru">{children}</DashboardShell>;
}
