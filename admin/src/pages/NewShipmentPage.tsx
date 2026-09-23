import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackagePlus, Plus, Trash2, UserRound, Truck, CircleDollarSign } from "lucide-react";
import { createShipment, getTransitaires, getUsers } from "../api/endpoints";
import { Card, Field, Modal, PageHeader, Spinner, btnGhost, btnPrimary, inputCls, statusLabel } from "../components/ui";
import type { ServiceType } from "../types";

const SERVICES: ServiceType[] = ["STANDARD", "EXPRESS", "ECONOMY"];
const CITIES_FR = ["Paris", "Lyon", "Marseille", "Toulouse", "Lille", "Bordeaux", "Nantes", "Strasbourg"];
const CITIES_MG = ["Antananarivo", "Tamatave", "Antsirabe", "Fianarantsoa", "Toliara", "Majunga", "Diego-Suarez"];

const emptyItem = { name: "", quantity: 1, weight: 1, declaredValue: 0 };

export default function NewShipmentPage() {
  const qc = useQueryClient();
  const [userId, setUserId] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("STANDARD");
  const [originCountry, setOriginCountry] = useState("France");
  const [originCity, setOriginCity] = useState("Paris");
  const [destCountry, setDestCountry] = useState("Madagascar");
  const [destCity, setDestCity] = useState("Antananarivo");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([emptyItem]);
  const [success, setSuccess] = useState<string | null>(null);

  const clients = useQuery({ queryKey: ["clients-select"], queryFn: () => getUsers({ page: 1, pageSize: 100, role: "CUSTOMER" }) });
  const transitaires = useQuery({ queryKey: ["transporteurs-select"], queryFn: () => getTransitaires({ page: 1, pageSize: 100 }) });

  const create = useMutation({
    mutationFn: () =>
      createShipment({
        userId,
        carrierId: carrierId || null,
        serviceType,
        origin: { country: originCountry, city: originCity },
        destination: { country: destCountry, city: destCity },
        sender: { name: senderName || undefined, phone: senderPhone || undefined, address: senderAddress || undefined },
        recipient: { name: recipientName || undefined, phone: recipientPhone || undefined, address: recipientAddress || undefined },
        requiredDocuments: [],
        notes: notes || undefined,
        items: items.map((i) => ({ ...i, quantity: Number(i.quantity), weight: Number(i.weight), declaredValue: Number(i.declaredValue) || 0 })),
      }),
    onSuccess: (d) => {
      setSuccess(d.shipment.trackingNumber ?? "créé");
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
      void qc.invalidateQueries({ queryKey: ["suivi"] });
    },
  });

  const updateItem = (i: number, patch: Partial<{ name: string; quantity: number; weight: number; declaredValue: number }>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  if (clients.isLoading || transitaires.isLoading) return <Spinner />;

  const totalWeight = items.reduce((a, i) => a + Number(i.weight || 0) * Number(i.quantity || 0), 0);

  return (
    <div>
      <PageHeader
        title="Nouveau colis"
        subtitle="Créez un colis pour un client et attribuez un transporteur"
        actions={<span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-600/20"><PackagePlus size={13} className="mr-1 inline" /> Poids total : {totalWeight} kg</span>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Client & route" subtitle="Destinataire du colis et parcours">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client" hint="requis">
                <div className="relative">
                  <UserRound size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select className={`${inputCls} pl-9`} value={userId} onChange={(e) => setUserId(e.target.value)}>
                    <option value="">— Choisir un client —</option>
                    {(clients.data?.users ?? []).map((u) => <option key={u.id} value={u.id}>{u.name} · {u.phone}</option>)}
                  </select>
                </div>
              </Field>
              <Field label="Transporteur" hint="facultatif">
                <div className="relative">
                  <Truck size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select className={`${inputCls} pl-9`} value={carrierId} onChange={(e) => setCarrierId(e.target.value)}>
                    <option value="">MadaColis en propre</option>
                    {(transitaires.data?.transitaires ?? []).map((t) => <option key={t.id} value={t.carrierId}>{t.name} ({t.carrierId})</option>)}
                  </select>
                </div>
              </Field>
              <Field label="Service">
                <select className={inputCls} value={serviceType} onChange={(e) => setServiceType(e.target.value as ServiceType)}>
                  {SERVICES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                </select>
              </Field>
              <div />
              <Field label="Origine — pays">
                <input className={inputCls} value={originCountry} onChange={(e) => setOriginCountry(e.target.value)} />
              </Field>
              <Field label="Origine — ville">
                <select className={inputCls} value={originCity} onChange={(e) => setOriginCity(e.target.value)}>
                  {CITIES_FR.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Destination — pays">
                <input className={inputCls} value={destCountry} onChange={(e) => setDestCountry(e.target.value)} />
              </Field>
              <Field label="Destination — ville">
                <select className={inputCls} value={destCity} onChange={(e) => setDestCity(e.target.value)}>
                  {CITIES_MG.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
            </div>
          </Card>

          <Card title="Expéditeur & destinataire" subtitle="Coordonnées sur le colis (facultatif)">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Expéditeur</p>
                <Field label="Nom"><input className={inputCls} value={senderName} onChange={(e) => setSenderName(e.target.value)} /></Field>
                <Field label="Téléphone"><input className={inputCls} value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} /></Field>
                <Field label="Adresse"><input className={inputCls} value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} /></Field>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Destinataire</p>
                <Field label="Nom"><input className={inputCls} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} /></Field>
                <Field label="Téléphone"><input className={inputCls} value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} /></Field>
                <Field label="Adresse"><input className={inputCls} value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} /></Field>
              </div>
            </div>
          </Card>

          <Card title="Articles" subtitle="Contenu du colis">
            <div className="space-y-3">
              {items.map((it, i) => (
                <div key={i} className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 sm:grid-cols-[1fr_80px_90px_110px_36px]">
                  <Field label="Désignation">
                    <input className={inputCls} value={it.name} onChange={(e) => updateItem(i, { name: e.target.value })} placeholder="Ex : vêtements" />
                  </Field>
                  <Field label="Qté">
                    <input type="number" min={1} className={inputCls} value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} />
                  </Field>
                  <Field label="Poids/kg">
                    <input type="number" min={0.01} step={0.1} className={inputCls} value={it.weight} onChange={(e) => updateItem(i, { weight: Number(e.target.value) })} />
                  </Field>
                  <Field label="Valeur (€)">
                    <input type="number" min={0} className={inputCls} value={it.declaredValue} onChange={(e) => updateItem(i, { declaredValue: Number(e.target.value) })} />
                  </Field>
                  {items.length > 1 ? (
                    <div className="flex items-end pb-1">
                      <button onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))} className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"><Trash2 size={16} /></button>
                    </div>
                  ) : null}
                </div>
              ))}
              <button className={btnGhost} onClick={() => setItems((p) => [...p, { ...emptyItem }])}><Plus size={15} /> Ajouter un article</button>
            </div>
          </Card>

          <Card title="Notes" subtitle="Informations complémentaires">
            <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Consigne au transporteur, assurances…" />
            <div className="mt-4 flex justify-end gap-2">
              <button className={btnGhost}>Réinitialiser</button>
              <button
                disabled={!userId || items.some((i) => !i.name.trim()) || create.isPending}
                onClick={() => void create.mutate()}
                className={btnPrimary}
              >
                <CircleDollarSign size={16} /> {create.isPending ? "Création…" : "Créer le colis"}
              </button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Résumé" subtitle="Synthèse de la commande">
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Service</dt><dd className="font-semibold text-slate-800">{statusLabel(serviceType)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Route</dt><dd className="font-semibold text-slate-800">{originCity} → {destCity}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Articles</dt><dd className="font-semibold text-slate-800">{items.length}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Poids total</dt><dd className="font-semibold text-slate-800">{totalWeight.toLocaleString("fr-FR")} kg</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-2.5"><dt className="text-slate-500">Statut initial</dt><dd className="font-semibold text-slate-800">En attente</dd></div>
            </dl>
          </Card>
          <Card title="Rappel" subtitle="Bonnes pratiques">
            <ul className="list-inside list-disc space-y-1.5 text-xs text-slate-500">
              <li>Choisissez bien le client destinataire du colis.</li>
              <li>Le prix est calculé selon la grille tarifaire active.</li>
              <li>Attribuez un transporteur pour un suivi dédié.</li>
              <li>Le n° de suivi est généré automatiquement.</li>
            </ul>
          </Card>
        </div>
      </div>

      {success ? (
        <Modal title="Colis créé" subtitle="Le colis a bien été enregistré" onClose={() => setSuccess(null)}>
          <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
            Colis <strong className="font-mono">{success}</strong> créé avec succès. Le statut initial est <strong>En attente</strong>.
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button className={btnGhost} onClick={() => { setSuccess(null); setItems([emptyItem]); setUserId(""); }}>Nouveau colis</button>
            <button className={btnGhost} onClick={() => setSuccess(null)}>Fermer</button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}