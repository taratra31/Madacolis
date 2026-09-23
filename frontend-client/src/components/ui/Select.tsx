import { forwardRef, useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, helper, options, placeholder, className, id, ...props },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={Boolean(error)}
        className={cn(
          "h-11 w-full appearance-none rounded-xl border bg-white px-3.5 text-sm text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-slate-100",
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-500/30 dark:border-red-700"
            : "border-slate-300 focus:border-blue-500 focus:ring-blue-500/25 dark:border-slate-700 dark:focus:border-blue-500",
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : helper ? (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{helper}</p>
      ) : null}
    </div>
  );
});