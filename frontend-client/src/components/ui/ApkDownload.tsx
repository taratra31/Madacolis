import { useRef, useState } from "react";
import { CheckCircle2, Download, Loader2, RotateCcw, Smartphone, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/contexts/locale";

type DownloadState =
  | { kind: "idle" }
  | { kind: "downloading"; progress: number }
  | { kind: "done"; sizeMB: string }
  | { kind: "error" };

const APK_URL = "/apk/madacolis.apk";

async function fetchWithProgress(url: string, onProgress: (loaded: number, total: number) => void): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const total = Number(response.headers.get("Content-Length")) || 0;
  if (!response.body) return response.blob();
  const reader = response.body.getReader() as ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>;
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const bytes = value.slice();
    chunks.push(bytes);
    loaded += bytes.byteLength;
    onProgress(loaded, total);
  }
  return new Blob(chunks, { type: response.headers.get("Content-Type") ?? "application/vnd.android.package-archive" });
}

export function ApkDownloadButton() {
  const { t } = useLocale();
  const [state, setState] = useState<DownloadState>({ kind: "idle" });
  const busy = useRef(false);

  const download = async () => {
    if (busy.current) return;
    busy.current = true;
    setState({ kind: "downloading", progress: 0 });
    try {
      const blob = await fetchWithProgress(APK_URL, (loaded, total) => {
        const progress = total > 0 ? Math.min(99, Math.round((loaded / total) * 100)) : 0;
        setState({ kind: "downloading", progress });
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "madacolis.apk";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      setState({ kind: "done", sizeMB: (blob.size / (1024 * 1024)).toFixed(0) });
    } catch {
      setState({ kind: "error" });
    } finally {
      busy.current = false;
    }
  };

  return (
    <div className="mt-6">
      <Button size="lg" variant="primary" className="btn-shine" onClick={() => void download()} disabled={state.kind === "downloading"}>
        {state.kind === "downloading" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : state.kind === "done" ? (
          <CheckCircle2 className="size-4" />
        ) : (
          <Smartphone className="size-4" />
        )}
        {state.kind === "downloading" ? t("download.downloading") : state.kind === "done" ? t("download.done") : t("download.button")}
      </Button>

      {state.kind === "downloading" && (
        <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/40">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-300">
              <Download className="size-4" /> {t("download.downloading")}…
            </span>
            <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300">{state.progress}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-200/70 dark:bg-blue-950">
            <div className="h-full rounded-full bg-blue-600 transition-all duration-200 dark:bg-blue-400" style={{ width: `${state.progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-blue-600/80 dark:text-blue-300/80">{t("download.keepWindow")}</p>
        </div>
      )}

      {state.kind === "done" && (
        <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50/70 px-4 py-3 text-sm dark:border-green-900 dark:bg-green-950/40">
          <CheckCircle2 className="size-4 shrink-0 text-green-600 dark:text-green-400" />
          <p className="font-medium text-green-700 dark:text-green-300">
            {t("download.success")} <span className="font-mono text-xs">({state.sizeMB} MB)</span>
          </p>
          <Button size="sm" variant="outline" className="ml-auto shrink-0" onClick={() => void download()}>
            <RotateCcw className="size-3.5" /> {t("download.redownload")}
          </Button>
        </div>
      )}

      {state.kind === "error" && (
        <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm dark:border-red-900 dark:bg-red-950/40">
          <XCircle className="size-4 shrink-0 text-red-600 dark:text-red-400" />
          <p className="font-medium text-red-700 dark:text-red-300">{t("download.error")}</p>
          <Button size="sm" variant="outline" className="ml-auto shrink-0" onClick={() => void download()}>
            <RotateCcw className="size-3.5" /> {t("common.retry")}
          </Button>
        </div>
      )}
    </div>
  );
}