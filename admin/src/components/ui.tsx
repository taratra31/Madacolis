import { X } from "lucide-react";
import type { ReactNode } from "react";

export const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const fmtMoney = (v?: number | null, currency?: string | null) =>
  v == null ? "—" : `${Number(v).toLocaleString("fr-FR")} ${currency ?? ""}`.trim();

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  RECEIVED: "Reçu",
  IN_TRANSIT: "En transit",
  IN_CUSTOMS: "En douane",
  OUT_FOR_DELIVERY: "En livraison",
  DELIVERED: "Livré",
  CANCELLED: "Annulé",
  PAID: "Payé",
  UNPAID: "Non payé",
  REFUNDED: "Remboursé",
  FAILED: "Échoué",
  ACTIF: "Actif",
  INACTIF: "Inactif",
  CUSTOMER: "Client",
  AGENT: "Agent",
  ADMIN: "Admin",
  TRANSITAIRE: "Transporteur",
  IDENTITY: "Pièce d'identité",
  INVOICE: "Facture",
  PROOF_OF_ADDRESS: "Justificatif",
  CUSTOMS_FORM: "Formulaire douane",
  VERIFIED: "Vérifié",
  REJECTED: "Rejeté",
  STANDARD: "Standard",
  EXPRESS: "Express",
  ECONOMY: "Économique",
  MVOLA: "MVola",
  ORANGE_MONEY: "Orange Money",
  AIRTEL_MONEY: "Airtel Money",
  TELEMONEY: "Telomoney",
  CARD: "Carte bancaire",
  CASH: "Espèces",
};

export const statusLabel = (value: string) => STATUS_LABELS[value] ?? value;

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  RECEIVED: "bg-blue-50 text-blue-700 ring-blue-600/20",
  IN_TRANSIT: "bg-sky-50 text-sky-700 ring-sky-600/20",
  IN_CUSTOMS: "bg-purple-50 text-purple-700 ring-purple-600/20",
  OUT_FOR_DELIVERY: "bg-teal-50 text-teal-700 ring-teal-600/20",
  DELIVERED: "bg-green-50 text-green-700 ring-green-600/20",
  CANCELLED: "bg-red-50 text-red-700 ring-red-600/20",
  PAID: "bg-green-50 text-green-700 ring-green-600/20",
  UNPAID: "bg-amber-50 text-amber-700 ring-amber-600/20",
  REFUNDED: "bg-slate-100 text-slate-600 ring-slate-500/20",
  FAILED: "bg-red-50 text-red-700 ring-red-600/20",
  ACTIF: "bg-green-50 text-green-700 ring-green-600/20",
  INACTIF: "bg-slate-100 text-slate-600 ring-slate-500/20",
  CUSTOMER: "bg-slate-100 text-slate-700 ring-slate-500/20",
  AGENT: "bg-orange-50 text-orange-700 ring-orange-600/20",
  ADMIN: "bg-purple-50 text-purple-700 ring-purple-600/20",
  TRANSITAIRE: "bg-sky-50 text-sky-700 ring-sky-600/20",
  IDENTITY: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  INVOICE: "bg-amber-50 text-amber-700 ring-amber-600/20",
  PROOF_OF_ADDRESS: "bg-teal-50 text-teal-700 ring-teal-600/20",
  CUSTOMS_FORM: "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
  VERIFIED: "bg-green-50 text-green-700 ring-green-600/20",
  REJECTED: "bg-red-50 text-red-700 ring-red-600/20",
  STANDARD: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  EXPRESS: "bg-rose-50 text-rose-700 ring-rose-600/20",
  ECONOMY: "bg-cyan-50 text-cyan-700 ring-cyan-600/20",
  MVOLA: "bg-blue-50 text-blue-700 ring-blue-600/20",
  ORANGE_MONEY: "bg-orange-50 text-orange-700 ring-orange-600/20",
  AIRTEL_MONEY: "bg-red-50 text-red-700 ring-red-600/20",
  TELEMONEY: "bg-sky-50 text-sky-700 ring-sky-600/20",
  CARD: "bg-violet-50 text-violet-700 ring-violet-600/20",
  CASH: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

export function Badge({ value, label }: { value: string; label?: string }) {
  const c = STATUS_STYLES[value] ?? "bg-slate-100 text-slate-600 ring-slate-500/20";
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4 ring-1 ring-inset ${c}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label ?? statusLabel(value)}
    </span>
  );
}

// ─── Boutons ───
export const btnPrimary =
  "inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:pointer-events-none";
export const btnGhost =
  "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50";
export const btnDanger =
  "inline-flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none";

// ─── Header de page ───
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

// ─── Carte statistique ───
export function StatCard({ label, value, sub, icon, accent }: { label: string; value: string | number; sub?: string; icon: ReactNode; accent?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-[26px] font-extrabold leading-none tracking-tight text-slate-900">{value}</p>
          {sub ? <p className="mt-2 text-xs font-medium text-slate-500">{sub}</p> : null}
        </div>
        <div className={`rounded-xl p-2.5 ${accent ?? "bg-blue-50 text-blue-600"}`}>{icon}</div>
      </div>
    </div>
  );
}

export function Spinner() {
  return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>;
}

export function Skeleton({ className = "h-4" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />;
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm font-semibold text-red-700">{message}</p>
      {onRetry ? (
        <button onClick={onRetry} className={`${btnDanger} mt-3`}>
          Réessayer
        </button>
      ) : null}
    </div>
  );
}

export function Card({ title, subtitle, action, children, className = "" }: { title?: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || action) ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            {subtitle ? <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Squelette de table ───
export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>{Array.from({ length: cols }).map((_, i) => <th key={i} className="py-2 pr-3"><Skeleton /></th>)}</tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: cols }).map((_, j) => <td key={j} className="py-3 pr-3"><Skeleton /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Barre de progression ───
export function ProgressBar({ value, max, color = "bg-blue-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Pagination({ page, totalPages, total, onChange }: { page: number; totalPages: number; total?: number; onChange: (p: number) => void }) {
  if (totalPages <= 0) return null;
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
      <p className="text-slate-500">
        {total != null ? <><strong className="font-semibold text-slate-700">{total}</strong> au total · </> : null}Page <strong className="font-semibold text-slate-700">{page}</strong> sur {totalPages}
      </p>
      <div className="flex gap-2">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className={btnGhost}>
          Précédent
        </button>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className={btnGhost}>
          Suivant
        </button>
      </div>
    </div>
  );
}

export function Modal({ title, subtitle, onClose, children, width = "max-w-lg" }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; width?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${width} rounded-2xl bg-white shadow-2xl`}>
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="font-bold text-slate-900">{title}</h3>
            {subtitle ? <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p> : null}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-xs font-bold text-slate-700">
        {label}
        {hint ? <span className="font-normal text-slate-400">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

export function EmptyRow({ colSpan, text }: { colSpan: number; text?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-sm font-medium">{text ?? "Aucune donnée."}</p>
        </div>
      </td>
    </tr>
  );
}