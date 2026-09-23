import { cn } from "@/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl shadow-md shadow-blue-600/30">
        <img src="/logo.png" alt="MadaColis" className="size-full object-cover" />
      </span>
      {!compact && (
        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Mada<span className="text-blue-600 dark:text-blue-400">Colis</span>
        </span>
      )}
    </span>
  );
}