import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Info, PackagePlus, Plus, Trash2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { PriceSummary } from "@/components/tracking/PriceSummary";
import { LocationPicker, RouteMap, type Location } from "@/components/ui/LocationPicker";
import { LinkOrderPanel, type LinkOrderResult } from "@/components/catalog/LinkOrderPanel";
import { useAuth } from "@/contexts/auth";
import { api, ApiError } from "@/services/api";
import {
  cn,
  CITIES_ARRIVEE,
  CITIES_DEPART,
  DOCUMENT_LABELS,
  SERVICE_DESCRIPTIONS,
  SERVICE_LABELS,
} from "@/utils";
import type { Currency, DocumentType, Quote, ServiceType, Shipment } from "@/types";

const STEPS = ["Itinéraire", "Contacts", "Articles", "Récapitulatif"] as const;

interface DraftItem {
  description: string;
  quantity: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  declaredValue: string;
  isFragile: boolean;
}

function emptyItem(): DraftItem {
  return { description: "", quantity: "1", weight: "", length: "", width: "", height: "", declaredValue: "", isFragile: false };
}

function toNum(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function CreateShipmentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const pendingLink = searchParams.get("link") ?? "";

  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [serviceType, setServiceType] = useState<ServiceType>("STANDARD");
  const [originCountry, setOriginCountry] = useState("Madagascar");
  const [originCity, setOriginCity] = useState("Antananarivo");
  const [destinationCountry, setDestinationCountry] = useState("France");
  const [destinationCity, setDestinationCity] = useState("Paris");
  const [originLocation, setOriginLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);
  const [sender, setSender] = useState({ name: user?.name ?? "", phone: user?.phone ?? "", address: user?.address ?? "" });
  const [recipient, setRecipient] = useState({ name: "", phone: "", address: "" });
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [requiredDocuments, setRequiredDocuments] = useState<DocumentType[]>([]);
  const [notes, setNotes] = useState("");

  const setItem = (index: number, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const applyLinkOrder = (result: LinkOrderResult) => {
    const { analyzed, specs } = result;
    setItems((prev) => [
      ...prev,
      {
        description: analyzed.title || analyzed.productId,
        quantity: "1",
        weight: specs.weightKg || "",
        length: specs.lengthCm || "",
        width: specs.widthCm || "",
        height: specs.heightCm || "",
        declaredValue: specs.declaredValueEUR || "",
        isFragile: false,
      },
    ]);
    setStep(2);
  };

  const totals = useMemo(() => {
    const totalWeight = items.reduce((sum, item) => sum + toNum(item.weight) * toNum(item.quantity), 0);
    const totalVolume = items.reduce((sum, item) => {
      const l = toNum(item.length);
      const w = toNum(item.width);
      const h = toNum(item.height);
      return l && w && h ? sum + ((l * w * h) / 1_000_000) * toNum(item.quantity) : sum;
    }, 0);
    const billingWeight = Math.max(totalWeight, totalVolume > 0 ? (totalVolume * 5000) / 1_000_000 : totalWeight);
    return { totalWeight, totalVolume, billingWeight };
  }, [items]);

  const quoteEnabled = step >= 2 && totals.totalWeight > 0 && sender.name.trim() !== "" && recipient.name.trim() !== "";
  const quotePayload = useMemo(
    () => ({
      originCountry,
      originCity,
      destinationCountry,
      destinationCity,
      serviceType,
      weightKg: Number(totals.billingWeight.toFixed(3)),
    }),
    [originCountry, originCity, destinationCountry, destinationCity, serviceType, totals.billingWeight],
  );

  const { data: quoteData, isFetching: quoteLoading, isError: quoteError } = useQuery({
    queryKey: ["create-quote", quotePayload],
    queryFn: () => api<{ quote: Quote }>("/pricing/quote", { method: "POST", body: quotePayload }),
    enabled: quoteEnabled,
  });

  const validateStep = (index: number): string => {
    if (index === 0) {
      if (!originCity.trim() || !destinationCity.trim()) return "Renseignez la ville de départ et la ville de destination.";
    }
    if (index === 1) {
      if (!sender.name.trim() || !sender.phone.trim()) return "Renseignez le nom et le téléphone de l'expéditeur.";
      if (!recipient.name.trim() || !recipient.phone.trim()) return "Renseignez le nom et le téléphone du destinataire.";
    }
    if (index === 2) {
      if (items.length === 0) return "Ajoutez au moins un article.";
      for (const item of items) {
        if (!item.description.trim()) return "Décrivez chaque article.";
        if (toNum(item.weight) <= 0) return "Le poids de chaque article doit être supérieur à 0.";
        if (toNum(item.quantity) <= 0) return "La quantité de chaque article doit être supérieure à 0.";
      }
    }
    return "";
  };

  const next = () => {
    const error = validateStep(step);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await api<{ shipment: Shipment }>("/shipments", {
        method: "POST",
        body: {
          origin: { country: originCountry, city: originCity },
          destination: { country: destinationCountry, city: destinationCity },
          serviceType,
          sender,
          recipient,
          items: items.map((item) => ({
            description: item.description.trim(),
            quantity: toNum(item.quantity),
            weight: toNum(item.weight),
            length: toNum(item.length) || undefined,
            width: toNum(item.width) || undefined,
            height: toNum(item.height) || undefined,
            declaredValue: toNum(item.declaredValue),
            isFragile: item.isFragile,
          })),
          notes: notes.trim() || undefined,
          requiredDocuments,
          currency: "EUR" as Currency,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["my-shipments"] });
      navigate(`/dashboard/shipments/${response.shipment.id}`);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Impossible de créer l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDocument = (doc: DocumentType) =>
    setRequiredDocuments((prev) => (prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Créer un envoi</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">4 étapes pour expédier votre colis.</p>
        </div>
        <Link to="/dashboard/shipments" className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          ← Retour à mes colis
        </Link>
      </div>

      <div className="flex gap-2">
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => index < step && setStep(index)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-center transition",
              index === step
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
                : index < step
                  ? "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
            )}
          >
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-bold",
                index < step
                  ? "bg-blue-600 text-white"
                  : index === step
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-400 dark:bg-slate-800",
              )}
            >
              {index < step ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span
              className={cn(
                "hidden text-xs font-medium sm:block",
                index === step ? "text-blue-700 dark:text-blue-400" : index < step ? "text-blue-700 dark:text-blue-500" : "text-slate-500 dark:text-slate-400",
              )}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      {stepError && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">{stepError}</p>
      )}

      {/* Étape 1 — Itinéraire */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Itinéraire et service</h2>
          </CardHeader>
          <CardBody className="grid gap-4">
            <Select
              label="Service"
              helper={SERVICE_DESCRIPTIONS[serviceType]}
              options={(Object.keys(SERVICE_LABELS) as ServiceType[]).map((type) => ({ value: type, label: SERVICE_LABELS[type] }))}
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceType)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-4">
                <Select
                  label="Pays de départ"
                  options={[
                    { value: "Madagascar", label: "Madagascar" },
                    { value: "France", label: "France" },
                  ]}
                  value={originCountry}
                  onChange={(e) => {
                    setOriginCountry(e.target.value);
                    setOriginCity("");
                    setOriginLocation(null);
                  }}
                />
                <LocationPicker
                  label="Ville de départ"
                  region={originCountry}
                  options={originCountry === "Madagascar" ? CITIES_DEPART : CITIES_ARRIVEE}
                  value={originLocation?.city ?? originCity}
                  onChange={(loc) => {
                    setOriginLocation(loc);
                    setOriginCity(loc.city);
                  }}
                  placeholder="Choisir…"
                />
              </div>
              <div className="grid gap-4">
                <Select
                  label="Pays de destination"
                  options={[
                    { value: "France", label: "France" },
                    { value: "Madagascar", label: "Madagascar" },
                  ]}
                  value={destinationCountry}
                  onChange={(e) => {
                    setDestinationCountry(e.target.value);
                    setDestinationCity("");
                    setDestinationLocation(null);
                  }}
                />
                <LocationPicker
                  label="Ville de destination"
                  region={destinationCountry}
                  options={destinationCountry === "France" ? CITIES_ARRIVEE : CITIES_DEPART}
                  value={destinationLocation?.city ?? destinationCity}
                  onChange={(loc) => {
                    setDestinationLocation(loc);
                    setDestinationCity(loc.city);
                  }}
                  placeholder="Choisir…"
                />
              </div>
            </div>

            <RouteMap
              origin={originLocation?.coordinates}
              destination={destinationLocation?.coordinates}
              distanceKm={quoteData?.quote.distanceKm}
            />
          </CardBody>
        </Card>
      )}

      {/* Étape 2 — Contacts */}
      {step === 1 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Expéditeur</h2>
            </CardHeader>
            <CardBody className="grid gap-4">
              <Input label="Nom complet" placeholder="Nom et prénom" value={sender.name} onChange={(e) => setSender({ ...sender, name: e.target.value })} />
              <Input label="Téléphone" placeholder="+261…" value={sender.phone} onChange={(e) => setSender({ ...sender, phone: e.target.value })} />
              <Input label="Adresse (optionnel)" placeholder="Lot, rue, commune…" value={sender.address} onChange={(e) => setSender({ ...sender, address: e.target.value })} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Destinataire</h2>
            </CardHeader>
            <CardBody className="grid gap-4">
              <Input label="Nom complet" placeholder="Nom et prénom" value={recipient.name} onChange={(e) => setRecipient({ ...recipient, name: e.target.value })} />
              <Input label="Téléphone" placeholder="+33… ou +261…" value={recipient.phone} onChange={(e) => setRecipient({ ...recipient, phone: e.target.value })} />
              <Input label="Adresse (optionnel)" placeholder="Rue, code postal…" value={recipient.address} onChange={(e) => setRecipient({ ...recipient, address: e.target.value })} />
            </CardBody>
          </Card>
        </div>
      )}

      {/* Étape 3 — Articles */}
      {step === 2 && (
        <div className="space-y-4">
          <LinkOrderPanel onSelect={applyLinkOrder} initialUrl={pendingLink} />
          {items.map((item, index) => (
            <Card key={index}>
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Article {index + 1}</h2>
                {items.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))} aria-label="Supprimer l'article">
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                )}
              </CardHeader>
              <CardBody className="grid gap-4">
                <Input label="Description" placeholder="Ex : vêtements, cadeaux, documents…" value={item.description} onChange={(e) => setItem(index, { description: e.target.value })} />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Input label="Quantité" type="number" inputMode="decimal" value={item.quantity} onChange={(e) => setItem(index, { quantity: e.target.value })} />
                  <Input label="Poids (kg)" type="number" inputMode="decimal" value={item.weight} onChange={(e) => setItem(index, { weight: e.target.value })} />
                  <Input label="Valeur (EUR)" type="number" inputMode="decimal" placeholder="0" value={item.declaredValue} onChange={(e) => setItem(index, { declaredValue: e.target.value })} />
                  <Checkbox className="self-end pb-3" label="Fragile" checked={item.isFragile} onChange={(e) => setItem(index, { isFragile: e.target.checked })} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Longueur (cm)" type="number" inputMode="decimal" value={item.length} onChange={(e) => setItem(index, { length: e.target.value })} />
                  <Input label="Largeur (cm)" type="number" inputMode="decimal" value={item.width} onChange={(e) => setItem(index, { width: e.target.value })} />
                  <Input label="Hauteur (cm)" type="number" inputMode="decimal" value={item.height} onChange={(e) => setItem(index, { height: e.target.value })} />
                </div>
              </CardBody>
            </Card>
          ))}

          <Button variant="outline" onClick={() => setItems((prev) => [...prev, emptyItem()])}>
            <Plus className="size-4" /> Ajouter un article
          </Button>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Documents (facultatif)</h2>
            </CardHeader>
            <CardBody className="grid gap-3">
              {(Object.keys(DOCUMENT_LABELS) as DocumentType[]).map((doc) => (
                <Checkbox
                  key={doc}
                  label={DOCUMENT_LABELS[doc]}
                  checked={requiredDocuments.includes(doc)}
                  onChange={() => toggleDocument(doc)}
                />
              ))}
              <Textarea label="Notes pour l'équipe (optionnel)" rows={3} placeholder="Précisions sur le contenu, instructions particulières…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </CardBody>
          </Card>

          {quoteEnabled && quoteError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">
              Impossible de calculer le devis pour le moment.
            </p>
          )}
        </div>
      )}

      {/* Étape 4 — Récapitulatif */}
      {step === 3 && (
        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Vérifiez votre commande</h2>
            </CardHeader>
            <CardBody className="space-y-4 text-sm">
              <div className="grid gap-1 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <p className="text-xs uppercase text-slate-400">Itinéraire · {SERVICE_LABELS[serviceType]}</p>
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {originCity} ({originCountry}) → {destinationCity} ({destinationCountry})
                </p>
              </div>
              <SummarySection title="Expéditeur" name={sender.name} phone={sender.phone} address={sender.address} />
              <SummarySection title="Destinataire" name={recipient.name} phone={recipient.phone} address={recipient.address} />
              <div className="grid gap-1 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <p className="text-xs uppercase text-slate-400">Articles ({items.length})</p>
                <ul className="space-y-1">
                  {items.map((item, index) => (
                    <li key={index} className="flex justify-between text-slate-700 dark:text-slate-200">
                      <span>
                        {item.quantity} × {item.description || "Article sans description"}
                        {item.isFragile && <span className="ml-1 text-xs text-amber-600">(fragile)</span>}
                      </span>
                      <span className="font-medium">{toNum(item.weight) * toNum(item.quantity)} kg</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-semibold dark:border-slate-700">
                  <span>Poids total</span>
                  <span>{totals.totalWeight.toFixed(2)} kg</span>
                </p>
                {requiredDocuments.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    Documents : {requiredDocuments.map((d) => DOCUMENT_LABELS[d]).join(", ")}
                  </p>
                )}
                {notes.trim() && <p className="mt-2 text-xs italic text-slate-500">Notes : {notes.trim()}</p>}
              </div>
            </CardBody>
          </Card>

          <div className="space-y-4 lg:col-span-2">
            {quoteLoading && <PriceSummarySkeleton />}
            {quoteData?.quote && !quoteLoading && <PriceSummary quote={quoteData.quote} />}
            <div className="rounded-xl bg-slate-100 p-4 text-xs text-slate-500 dark:bg-slate-800">
              <p className="flex items-start gap-2">
                <Info className="mt-0.5 size-4 shrink-0 text-slate-400" />
                Le prix définitif est recalculé à la création de l'envoi. Le paiement se fera depuis la page du colis, après réception de l'accord de l'équipe.
              </p>
            </div>
          </div>
        </div>
      )}

      {submitError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">{submitError}</p>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ArrowLeft className="size-4" /> Retour
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next}>
            Continuer <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={submit} loading={submitting} disabled={!quoteData?.quote}>
            <PackagePlus className="size-4" /> Confirmer l'envoi
          </Button>
        )}
      </div>
    </div>
  );
}

function SummarySection({ title, name, phone, address }: { title: string; name: string; phone: string; address: string }) {
  return (
    <div className="grid gap-1 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
      <p className="text-xs uppercase text-slate-400">{title}</p>
      <p className="font-medium text-slate-800 dark:text-slate-100">{name || "—"}</p>
      <p className="text-slate-500">{phone}</p>
      {address && <p className="text-slate-500">{address}</p>}
    </div>
  );
}

function PriceSummarySkeleton() {
  return (
    <Card className="bg-brand-900 text-white">
      <CardBody className="animate-pulse space-y-3 p-5">
        <div className="h-4 w-32 rounded bg-white/20" />
        <div className="h-4 rounded bg-white/10" />
        <div className="h-4 rounded bg-white/10" />
        <div className="h-10 rounded-lg bg-white/10" />
      </CardBody>
    </Card>
  );
}