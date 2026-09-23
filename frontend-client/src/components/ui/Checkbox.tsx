import type { InputHTMLAttributes } from "react";
import { cn } from "@/utils";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300", className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 rounded border-slate-300 accent-blue-600 focus:ring-blue-500 dark:border-slate-700"
        {...props}
      />
      {label && <span className="leading-snug">{label}</span>}
    </label>
  );
}