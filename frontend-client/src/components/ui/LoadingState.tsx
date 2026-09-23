import { Loader2 } from "lucide-react";
import { cn } from "@/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-5 animate-spin", className)} aria-label="Chargement" />;
}

export function LoadingState({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
      <Spinner className="size-7 text-blue-600 dark:text-blue-400" />
      <p className="text-sm">{label}</p>
    </div>
  );
}