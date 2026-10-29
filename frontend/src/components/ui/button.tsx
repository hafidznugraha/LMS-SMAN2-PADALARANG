import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "pill" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const variantStyles = {
      primary: "bg-[#1E3A8A] hover:bg-blue-950 text-white rounded-xl shadow-sm focus-visible:ring-blue-900",
      secondary: "bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl focus-visible:ring-slate-400",
      pill: "bg-[#FEF3C7] hover:bg-amber-200 text-amber-900 rounded-full font-semibold focus-visible:ring-amber-500",
      destructive: "bg-red-600 hover:bg-red-700 text-white rounded-xl focus-visible:ring-red-600",
      ghost: "hover:bg-slate-100 text-slate-700 rounded-xl",
    }[variant];

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2.5 gap-2",
      lg: "text-base px-6 py-3 gap-2.5",
    }[size];

    return (
      <button ref={ref} className={cn(baseStyles, variantStyles, sizeStyles, className)} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
