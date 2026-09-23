import type { ReactNode } from "react";
import { cn } from "@/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  className?: string;
  size?: "md" | "lg";
}

export function Segmented<T extends string>({ value, onChange, options, className, size = "md" }: SegmentedProps<T>) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  return (
    <div
      role="tablist"
      className={cn(
        "relative grid select-none rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800",
        size === "lg" ? "grid-cols-2" : "grid-cols-2",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="absolute inset-y-1 rounded-full bg-white shadow-md transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:bg-slate-900"
        style={{
          width: `calc((100% - 8px) / ${options.length})`,
          left: 4,
          transform: `translateX(${index * 100}%)`,
          transition:
            "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms, background-color 220ms",
        }}
      />
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-200",
              size === "lg" ? "py-2.5 text-[15px]" : "py-2",
              active
                ? "text-blue-700 dark:text-blue-300"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}