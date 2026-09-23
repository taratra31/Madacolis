import { Globe } from "lucide-react";
import { useLocale } from "@/contexts/locale";
import { cn } from "@/utils";

export function LanguageSwitcher() {
  const { lang, setLang } = useLocale();

  return (
    <div
      className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-900"
      role="group"
      aria-label="Langue / Language"
    >
      <Globe className="ml-1.5 size-3.5 text-slate-400" />
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            "rounded-lg px-2 py-1 text-xs font-bold uppercase transition-all",
            lang === l
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
          )}
          aria-pressed={lang === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}