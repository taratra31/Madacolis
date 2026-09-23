import type { ReactNode } from "react";

export function PageHeader({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-slate-800 bg-brand-950 py-14">
      <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-40" />
      <div className="pointer-events-none absolute -left-24 -top-24 size-72 animate-blob bg-blue-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-6 size-64 animate-blob bg-teal-400/10 blur-3xl" style={{ animationDelay: "-6s" }} />
      <div className="container-page animate-fade-up relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-white lg:text-4xl">{title}</h1>
          {description && <p className="mt-3 leading-relaxed text-slate-300">{description}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}