import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Box, ChevronLeft } from "lucide-react";
import { cn } from "@/utils";

const TAGLINES = {
  login: "Commandez en France, recevez à Madagascar.",
  register: "Rejoignez-nous et profitez de la livraison France → Madagascar.",
} as const;

type Mode = keyof typeof TAGLINES;

export function AuthShell({ mode, children, footer }: { mode: Mode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#020617] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#020617_0%,#0F172A_30%,#1E3A8A_65%,#2563EB_100%)]" />
      <div className="pointer-events-none absolute -right-16 -top-24 size-64 animate-blob rounded-full bg-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 top-1/3 size-52 animate-blob rounded-full bg-purple-500/15 blur-3xl" style={{ animationDelay: "-6s" }} />
      <div className="pointer-events-none absolute -bottom-28 -right-10 size-72 animate-blob rounded-full bg-blue-600/25 blur-3xl" style={{ animationDelay: "-3s" }} />
      <div className="pointer-events-none absolute left-1/2 top-1/4 size-80 -translate-x-1/2 animate-pulse-soft rounded-full bg-white/5 blur-2xl" />

      <Link
        to="/"
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur transition hover:bg-white/20 hover:text-white"
      >
        <ChevronLeft className="size-3.5" /> Retour à l'accueil
      </Link>

      <div className="relative flex w-full max-w-md flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="rounded-[26px] bg-white/15 p-1 shadow-[0_8px_22px_rgba(59,130,246,0.6)]">
            <div className="flex size-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 shadow-lg shadow-blue-900/40 sm:size-[72px]">
              <Box className="size-8 text-white" />
            </div>
          </div>
          <h1 className="mt-1 text-[32px] font-black tracking-wide text-white">MadaColis</h1>
          <p className="max-w-xs text-sm leading-5 text-blue-200">{TAGLINES[mode]}</p>
        </div>

        <div className="w-full rounded-3xl bg-white/95 p-5 shadow-[0_18px_32px_rgba(0,0,0,0.45)] sm:p-6">
          <div className="mb-5 flex rounded-xl bg-indigo-50 p-1">
            <Link
              to="/login"
              className={cn(
                "flex-1 rounded-lg py-2.5 text-center text-sm font-extrabold transition",
                mode === "login"
                  ? "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              Connexion
            </Link>
            <Link
              to="/register"
              className={cn(
                "flex-1 rounded-lg py-2.5 text-center text-sm font-extrabold transition",
                mode === "register"
                  ? "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              Inscription
            </Link>
          </div>
          {children}
        </div>
        {footer && <div className="text-center text-sm font-medium text-slate-300">{footer}</div>}
        <p className="text-xs font-medium tracking-wide text-slate-400/80">
          © 2026 MadaColis · Livraison France ⇄ Madagascar
        </p>
      </div>
    </div>
  );
}