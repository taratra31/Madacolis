import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-blue-600 text-white transition hover:bg-blue-700 active:scale-[0.98] shadow-sm shadow-blue-600/25 focus-visible:ring-blue-500/40",
  secondary:
    "bg-brand-900 text-white hover:bg-brand-800 shadow-sm shadow-brand-900/20 focus-visible:ring-brand-500/40",
  outline:
    "border border-slate-300 bg-white text-slate-700 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:border-blue-600 dark:hover:bg-blue-950/30 dark:hover:text-blue-300 active:scale-[0.98]",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
  danger: "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] focus-visible:ring-red-400/50 shadow-sm shadow-red-600/20",
  dark: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({ variant = "primary", size = "md", loading, fullWidth, className, children, disabled, ...props }: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}