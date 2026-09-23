import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PackagePlus } from "lucide-react";
import { createTransitaireShipment } from "@/services/transitaire";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { CITIES_DEPART, CITIES_ARRIVEE, DOCUMENT_LABELS, formatCurrency } from "@/utils";
import { SERVICE_TYPES } from "@/types";
import type { ServiceType } from "@/types";

export function TransitaireNewShipmentPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    clientPhone: "",
    originCity: "Paris",
    destinationCity: "Antananarivo",
    serviceType: "STANDARD" as ServiceType,
    totalWeight: "",
    declaredValue: "",
    currency: "EUR",
    estimatedDeliveryDate: "",
    senderName: "",
    senderPhone: "",
    recipientName: "",
    recipientPhone: "",
    recipientAddress: "",
    notes: "",
  });
  const [requiredDocs, setRequiredDocs] = useState<string[]>(["IDENTITY"]);

  const est = () => {
    const kg = Number(form.totalWeight) || 0;
    const base = form.serviceType === "EXPRESS" ? 45000 : form.serviceType === "ECONOMY" ? 25000 : 35000;
    const priceAr = Math.max(base, base + kg * 12000);
    return form.currency === "EUR" ? Math.round(priceAr / 5000) : priceAr;
  };

  const { mutate, isPending, isError, error, reset, data } = useMutation({
    mutationFn: () =>
      createTransitaireShipment({
        clientPhone: form.clientPhone.trim(),
        originCountry: "France",
        originCity: form.originCity,
        destinationCountry: "Madagascar",
        destinationCity: form.destinationCity,
        serviceType: form.serviceType,
        totalWeight: Number(form.totalWeight),
        declaredValue: Number(form.declaredValue) || 0,
        currency: form.currency as "EUR" | "MGA" | "USD",
        estimatedPrice: est(),
        estimatedDeliveryDate: form.estimatedDeliveryDate || undefined,
        senderName: form.senderName.trim() || undefined,
        senderPhone: form.senderPhone.trim() || undefined,
        recipientName: form.recipientName.trim() || undefined,
        recipientPhone: form.recipientPhone.trim() || undefined,
        recipientAddress: form.recipientAddress.trim() || undefined,
        requiredDocuments: requiredDocs as never,
        notes: form.notes.trim() || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["transitaire-shipments"] });
      void qc.invalidateQueries({ queryKey: ["transitaire-stats"] });
      void qc.invalidateQueries({ queryKey: ["transitaire-notifications"] });
    },
  });

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const invalid = !form.clientPhone.trim() || !(Number(form.totalWeight) > 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          <PackagePlus className="mr-2 inline size-6 text-indigo-600 dark:text-indigo-400" />
          Nouveau colis
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Créez un envoi pour un client existant (numéro de téléphone requis).</p>
      </div>

      {data && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          {data.message}
          <button
            onClick={() => {
              reset();
              setForm((f) => ({ ...f, clientPhone: "", totalWeight: "", declaredValue: "" }));
            }}
            className="ml-3 underline"
          >
            + Nouveau
          </button>
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error instanceof Error ? error.message : "Erreur lors de la création"}
        </div>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Client & trajet</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Téléphone du client *"
            placeholder="+261 34 000 00 03"
            value={form.clientPhone}
            onChange={set("clientPhone")}
            helper="Le client doit exister dans votre liste de clients."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Ville d'origine" options={CITIES_ARRIVEE.map((c) => ({ value: c, label: c }))} value={form.originCity} onChange={set("originCity")} />
            <Select label="Ville de destination" options={CITIES_DEPART.map((c) => ({ value: c, label: c }))} value={form.destinationCity} onChange={set("destinationCity")} />
          </div>
          <Select
            label="Service"
            options={SERVICE_TYPES.map((s) => ({
              value: s,
              label: s === "STANDARD" ? "Standard" : s === "EXPRESS" ? "Express" : "Économique",
            }))}
            value={form.serviceType}
            onChange={set("serviceType")}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Colis & tarification</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Poids total (kg) *" type="number" min="0.1" step="0.1" value={form.totalWeight} onChange={set("totalWeight")} />
            <Input label="Valeur déclarée" type="number" min="0" value={form.declaredValue} onChange={set("declaredValue")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Devise"
              options={[
                { value: "EUR", label: "Euro (EUR)" },
                { value: "MGA", label: "Ariary (Ar)" },
              ]}
              value={form.currency}
              onChange={set("currency")}
            />
            <Input label="Date de livraison estimée" type="date" value={form.estimatedDeliveryDate} onChange={set("estimatedDeliveryDate")} />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3 text-sm dark:bg-indigo-950/40">
            <span className="font-medium text-slate-600 dark:text-slate-300">Prix estimatif calculé</span>
            <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{formatCurrency(est(), form.currency)}</span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Expéditeur / destinataire</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Expéditeur" value={form.senderName} onChange={set("senderName")} />
            <Input label="Téléphone expéditeur" value={form.senderPhone} onChange={set("senderPhone")} />
            <Input label="Destinataire" value={form.recipientName} onChange={set("recipientName")} />
            <Input label="Téléphone destinataire" value={form.recipientPhone} onChange={set("recipientPhone")} />
          </div>
          <Input label="Adresse du destinataire" value={form.recipientAddress} onChange={set("recipientAddress")} />
          <Textarea label="Notes" rows={2} value={form.notes} onChange={set("notes")} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Documents requis</h2>
        </CardHeader>
        <CardBody>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(DOCUMENT_LABELS) as (keyof typeof DOCUMENT_LABELS)[]).map((k) => (
              <Checkbox
                key={k}
                checked={requiredDocs.includes(k)}
                onChange={(e) => setRequiredDocs((d) => (e.target.checked ? [...d, k] : d.filter((x) => x !== k)))}
                label={DOCUMENT_LABELS[k]}
              />
            ))}
          </div>
        </CardBody>
      </Card>

      <Button fullWidth size="lg" loading={isPending} disabled={invalid} onClick={() => mutate()}>
        <PackagePlus className="size-5" /> Créer le colis
      </Button>
    </div>
  );
}