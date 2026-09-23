import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";
import type { ReactNode } from "react";
import { cn } from "@/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helper, icon, suffix, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">{icon}</span>}
        {suffix && <span className="absolute inset-y-0 right-2 flex items-center">{suffix}</span>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100",
            icon ? "pl-10" : "",
            suffix ? "pr-10" : "",
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-500/30 dark:border-red-700"
              : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/25 dark:border-slate-700 dark:focus:border-blue-500",
            className,
          )}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : helper ? (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{helper}</p>
      ) : null}
    </div>
  );
});