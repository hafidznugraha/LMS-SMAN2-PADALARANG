import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  variant?: "primary" | "white" | "success" | "cyan";
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "white",
  className,
}: MetricCardProps) {
  const containerStyles = {
    primary: "bg-[#1D4ED8] text-white shadow-sm",
    white: "bg-white text-slate-900 border border-slate-200/80 shadow-xs",
    success: "bg-emerald-600 text-white shadow-sm",
    cyan: "bg-sky-600 text-white shadow-sm",
  }[variant];

  const iconStyles = {
    primary: "bg-blue-600 text-white",
    white: "bg-slate-100 text-slate-700",
    success: "bg-emerald-700/60 text-white",
    cyan: "bg-sky-700/60 text-white",
  }[variant];

  return (
    <div className={cn("p-4 rounded-2xl flex items-center justify-between", containerStyles, className)}>
      <div>
        <p className="text-xs font-medium opacity-80">{title}</p>
        <h3 className="text-2xl font-bold tracking-tight mt-0.5">{value}</h3>
        <p className="text-xs opacity-75 mt-0.5">{subtitle}</p>
      </div>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", iconStyles)}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
