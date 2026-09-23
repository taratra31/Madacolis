import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, RefreshCw, Tag } from "lucide-react";
import { createPricingRule, deletePricingRule, getPricingRules, updatePricingRule } from "../api/endpoints";
import { Badge, Card, EmptyRow, Field, Modal, PageHeader, Spinner, statusLabel, fmtMoney, btnGhost, btnDanger, btnPrimary, inputCls } from "../components/ui";
import type { Currency, PricingRule, ServiceType } from "../types";

const SERVICES: ServiceType[] = ["STANDARD", "EXPRESS", "ECONOMY"];
const CURRENCIES: Currency[] = ["MGA", "EUR", "USD"];

const empty = {
  name: "",
  originCountry: "",
  destinationCountry: "",
  serviceType: "STANDARD" as ServiceType,
  basePrice: "",
  pricePerKg: "",
  pricePerKm: "",
  minimumPrice: "",
  currency: "MGA" as Currency,
  isActive: true,
};

export default function PricingPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<PricingRule | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [deleting, setDeleting] = useState<PricingRule | null>(null);

  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["pricing"], queryFn: getPricingRules });

  const reset = () => { setForm({ ...empty }); setEditing(null); setCreating(false); };

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        originCountry: form.originCountry.trim(),
        destinationCountry: form.destinationCountry.trim(),
        serviceType: form.serviceType,
        basePrice: Number(form.basePrice),
        pricePerKg: Number(form.pricePerKg),
        pricePerKm: form.pricePerKm === "" ? null : Number(form.pricePerKm),
        minimumPrice: Number(form.minimumPrice),
        currency: form.currency,
        isActive: form.isActive,
      };
      return editing ? updatePricingRule(editing.id, payload) : createPricingRule(payload);
    },
    onSuccess: () => {
      reset();
      void qc.invalidateQueries({ queryKey: ["pricing"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const doDelete = useMutation({
    mutationFn: (id: string) => deletePricingRule(id),
    onSuccess: () => {
      setDeleting(null);
      void qc.invalidateQueries({ queryKey: ["pricing"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const openEdit = (r: PricingRule) => {
    setEditing(r);
    setForm({
      name: r.name,
      originCountry: r.originCountry,
      destinationCountry: r.destinationCountry,
      serviceType: r.serviceType,
      basePrice: String(r.basePrice),
      pricePerKg: String(r.pricePerKg),
      pricePerKm: r.pricePerKm == null ? "" : String(r.pricePerKm),
      minimumPrice: String(r.minimumPrice),
      currency: r.currency,
      isActive: r.isActive,
    });
  };

  const set = (k: keyof typeof empty) => (v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <PageHeader
        title="Règles de tarification"
        subtitle="Configurez les prix par route, service et poids"
        actions={
          <>
            <button className={btnGhost} onClick={() => void refetch()}><RefreshCw size={16} /> Actualiser</button>
            <button onClick={() => { setCreating(true); setEditing(null); setForm({ ...empty }); }} className={btnPrimary}>
              <Plus size={16} /> Nouvelle règle
            </button>
          </>
        }
      />

      <Card
        title="Règles actives"
        subtitle={data ? `${data.rules.length} règle(s) configurée(s)` : undefined}
      >
        {isLoading ? <Spinner /> : error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">Erreur de chargement.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-2 pr-3 font-bold">Nom</th>
                  <th className="py-2 pr-3 font-bold">Origine → Destination</th>
                  <th className="py-2 pr-3 font-bold">Service</th>
                  <th className="py-2 pr-3 font-bold">Base</th>
                  <th className="py-2 pr-3 font-bold">/kg</th>
                  <th className="py-2 pr-3 font-bold">Min</th>
                  <th className="py-2 pr-3 font-bold">Statut</th>
                  <th className="py-2 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!data || data.rules.length === 0 ? <EmptyRow colSpan={8} text="Aucune règle de tarification configurée." /> : data.rules.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                    <td className="py-3 pr-3 font-semibold text-slate-900">{r.name}</td>
                    <td className="py-3 pr-3 text-xs text-slate-600">{r.originCountry} → {r.destinationCountry}</td>
                    <td className="py-3 pr-3"><Badge value={r.serviceType} /></td>
                    <td className="py-3 pr-3 text-xs font-medium text-slate-700">{fmtMoney(r.basePrice, r.currency)}</td>
                    <td className="py-3 pr-3 text-xs text-slate-500">{fmtMoney(r.pricePerKg, r.currency)}</td>
                    <td className="py-3 pr-3 text-xs text-slate-500">{fmtMoney(r.minimumPrice, r.currency)}</td>
                    <td className="py-3 pr-3">
                      <Badge value={r.isActive ? "ACTIF" : "INACTIF"} label={r.isActive ? "Active" : "Inactive"} />
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(r)} className="rounded-lg p-2 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600" title="Modifier"><Pencil size={16} /></button>
                        <button onClick={() => setDeleting(r)} className="rounded-lg p-2 text-red-600 transition hover:bg-red-50" title="Supprimer"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {(creating || editing) ? (
        <Modal title={editing ? "Modifier la règle" : "Nouvelle règle"} subtitle={editing ? `Règle : ${editing.name}` : undefined} onClose={() => { if (!save.isPending) reset(); }} width="max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Nom de la règle" hint="Ex : France → Antananarivo Standard">
                <input className={inputCls} value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="France → Antananarivo Standard" />
              </Field>
            </div>
            <Field label="Pays d'origine"><input className={inputCls} value={form.originCountry} onChange={(e) => set("originCountry")(e.target.value)} placeholder="France" /></Field>
            <Field label="Pays de destination"><input className={inputCls} value={form.destinationCountry} onChange={(e) => set("destinationCountry")(e.target.value)} placeholder="Madagascar" /></Field>
            <Field label="Service"><select className={inputCls} value={form.serviceType} onChange={(e) => set("serviceType")(e.target.value as ServiceType)}>{SERVICES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}</select></Field>
            <Field label="Devise"><select className={inputCls} value={form.currency} onChange={(e) => set("currency")(e.target.value as Currency)}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
            <Field label="Prix de base"><input type="number" step="0.01" className={inputCls} value={form.basePrice} onChange={(e) => set("basePrice")(e.target.value)} placeholder="25000" /></Field>
            <Field label="Prix par kilo"><input type="number" step="0.01" className={inputCls} value={form.pricePerKg} onChange={(e) => set("pricePerKg")(e.target.value)} placeholder="2500" /></Field>
            <Field label="Prix par km" hint="facultatif"><input type="number" step="0.01" className={inputCls} value={form.pricePerKm} onChange={(e) => set("pricePerKm")(e.target.value)} placeholder="50" /></Field>
            <Field label="Prix minimum"><input type="number" step="0.01" className={inputCls} value={form.minimumPrice} onChange={(e) => set("minimumPrice")(e.target.value)} placeholder="30000" /></Field>
            <label className="col-span-2 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium">
              <input type="checkbox" className="h-4 w-4 rounded" checked={form.isActive} onChange={(e) => set("isActive")(e.target.checked)} />
              <span className="text-slate-700">Règle active et utilisable par le système</span>
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button disabled={save.isPending} onClick={reset} className={btnGhost}>Annuler</button>
            <button
              disabled={save.isPending || !form.name.trim() || !form.originCountry.trim() || !form.destinationCountry.trim()}
              onClick={() => void save.mutate()}
              className={btnPrimary}
            >
              {save.isPending ? "Enregistrement…" : editing ? "Mettre à jour" : "Créer la règle"}
            </button>
          </div>
        </Modal>
      ) : null}

      {deleting ? (
        <Modal title="Supprimer la règle" subtitle="Cette action est irréversible" onClose={() => { if (!doDelete.isPending) setDeleting(null); }}>
          <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4">
            <Tag size={20} className="mt-0.5 shrink-0 text-red-500" />
            <p className="text-sm text-slate-700">
              Voulez-vous vraiment supprimer la règle <strong className="text-slate-900">{deleting.name}</strong> ? Le moteur tarifaire ne l'utilisera plus.
            </p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button disabled={doDelete.isPending} onClick={() => setDeleting(null)} className={btnGhost}>Annuler</button>
            <button disabled={doDelete.isPending} onClick={() => void doDelete.mutate(deleting.id)} className={btnDanger}>
              {doDelete.isPending ? "Suppression…" : "Supprimer"}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}