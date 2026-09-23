import type { ReactNode } from "react";
import { cn, STATUS_LABELS, STATUS_STYLES } from "@/utils";
import type { ShipmentStatus } from "@/types";

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ value }: { value: ShipmentStatus }) {
  return <Badge className={STATUS_STYLES[value]}>{STATUS_LABELS[value]}</Badge>;
}