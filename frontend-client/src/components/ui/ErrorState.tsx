import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ErrorState({ title = "Une erreur est survenue", message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-900 dark:bg-red-950/40">
      <div className="flex size-12 items-center justify-center rounded-full bg-white text-red-500 shadow-sm dark:bg-slate-900">
        <AlertTriangle className="size-6" />
      </div>
      <p className="font-semibold text-red-700 dark:text-red-300">{title}</p>
      {message && <p className="max-w-md text-sm text-red-600 dark:text-red-400">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} type="button">
          Réessayer
        </Button>
      )}
    </div>
  );
}