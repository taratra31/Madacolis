import { forwardRef, useId } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, error, className, id, ...props }, ref) {
  const autoId = useId();
  const areaId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={areaId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={areaId}
        aria-invalid={Boolean(error)}
        className={cn(
          "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100",
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-500/30 dark:border-red-700"
            : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/25 dark:border-slate-700 dark:focus:border-blue-500",
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
});