const colors: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  RECEIVED: "bg-sky-50 text-sky-700 ring-sky-200",
  IN_TRANSIT: "bg-blue-50 text-blue-700 ring-blue-200",
  IN_CUSTOMS: "bg-purple-50 text-purple-700 ring-purple-200",
  OUT_FOR_DELIVERY: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  FAILED: "bg-red-50 text-red-700 ring-red-200",
  REFUNDED: "bg-slate-100 text-slate-600 ring-slate-200",
  ADMIN: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
  AGENT: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  CUSTOMER: "bg-slate-100 text-slate-600 ring-slate-200",
  true: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  false: "bg-slate-100 text-slate-600 ring-slate-200",
  VERIFIED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
};

const dots: Record<string, string> = {
  PENDING: "bg-amber-500",
  RECEIVED: "bg-sky-500",
  IN_TRANSIT: "bg-blue-500",
  IN_CUSTOMS: "bg-purple-500",
  OUT_FOR_DELIVERY: "bg-cyan-500",
  DELIVERED: "bg-emerald-500",
  CANCELLED: "bg-red-500",
  PAID: "bg-emerald-500",
  FAILED: "bg-red-500",
  ADMIN: "bg-fuchsia-500",
  AGENT: "bg-cyan-500",
  true: "bg-emerald-500",
  false: "bg-slate-400",
  VERIFIED: "bg-emerald-500",
  REJECTED: "bg-red-500",
};

export default function StatusBadge({ value }: { value: string | boolean }) {
  const key = String(value);
  const cls = colors[key] ?? "bg-slate-100 text-slate-700 ring-slate-200";
  const dot = dots[key] ?? "bg-slate-400";
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {String(value).replace(/_/g, " ")}
    </span>
  );
}