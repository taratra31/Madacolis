import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Clock,
  Layers,
  Loader2,
  MapPin,
  Package,
  Plane,
  Ruler,
  Ship,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Weight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Modal } from "@/components/ui/Modal";
import { Reveal } from "@/components/ui/Reveal";
import { useCart } from "@/contexts/cart";
import { api } from "@/services/api";
import { cn, formatAr, formatAriary, formatCurrency } from "@/utils";
import type { AmazonProduct, ProductQuote, Quote, ServiceType, ShippingMethod, Transitaire } from "@/types";

const selectCellClass =
  "h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

function DetailRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
      <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Icon className="size-4 text-blue-600 dark:text-blue-400" /> {label}
      </span>
      <span className="flex items-center gap-2 text-right font-medium text-slate-800 dark:text-slate-100">{children}</span>
    </div>
  );
}

interface ProductResponse {
  product: AmazonProduct;
  source?: "paapi" | "curated";
}

interface TransitairesResponse {
  transitaires: Transitaire[];
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();

  const [quantity] = useState(1);
  const [weightKg, setWeightKg] = useState(0.5);
  const [lengthCm, setLengthCm] = useState(20);
  const [widthCm, setWidthCm] = useState(15);
  const [heightCm, setHeightCm] = useState(10);
  const [destinationCity] = useState("Antananarivo");
  const [serviceType, setServiceType] = useState<ServiceType>("STANDARD");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("AIR");
  const [transitaireId, setTransitaireId] = useState("madacolis");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);

  const { data, isFetching, isError } = useQuery({
    queryKey: ["product-detail", id],
    queryFn: () => api<ProductResponse>(`/pricing/marketplace/amazon/product/${id}`),
    enabled: Boolean(id),
    retry: 1,
  });

  const { data: transitairesData } = useQuery({
    queryKey: ["transitaires"],
    queryFn: () => api<TransitairesResponse>("/pricing/marketplace/transitaires"),
    staleTime: 60_000,
  });

  const transitaires = transitairesData?.transitaires ?? [];
  const selectedTransitaire = transitaires.find((t) => t.id === transitaireId) ?? transitaires[0];

  const product = data?.product;

  useEffect(() => {
    if (!product) return;
    if (product.weightKg != null) setWeightKg(product.weightKg);
    if (product.lengthCm != null) setLengthCm(product.lengthCm);
    if (product.widthCm != null) setWidthCm(product.widthCm);
    if (product.heightCm != null) setHeightCm(product.heightCm);
  }, [product]);

  const computeQuote = async () => {
    if (!product) return;
    setQuoteLoading(true);
    try {
      const res = await api<ProductQuote>("/pricing/product-quote", {
        method: "POST",
        body: {
          title: product.title,
          quantity,
          weightKg,
          lengthCm,
          widthCm,
          heightCm,
          declaredValueEUR: product.priceEUR ?? undefined,
          destinationCountry: "Madagascar",
          destinationCity,
          serviceType,
          shippingMethod,
          transitaireId,
        },
      });
      setQuote(res.quote);
    } catch {
      window.alert("Impossible de calculer la livraison. Réessayez.");
    } finally {
      setQuoteLoading(false);
    }
  };

  const onConfigChange = (updater: () => void) => {
    setQuote(null);
    updater();
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.asin,
      name: product.title,
      imageUrl: product.imageUrl,
      price: product.priceEUR ?? 0,
      quantity,
      weightKg,
      lengthCm,
      widthCm,
      heightCm,
      marketplace: "AMAZON",
      sourceUrl: product.url,
    });
    setCartModalOpen(true);
  };

  if (isFetching) {
    return (
      <div className="container-page flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="container-page py-16 text-center">
        <Reveal variant="zoom">
          <Package className="mx-auto size-14 animate-float text-slate-300 dark:text-slate-600" />
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Produit introuvable</h1>
          <Link to="/catalogue" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            <ArrowLeft className="size-4" /> Retour au catalogue
          </Link>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <Reveal variant="fade">
        <Link to="/catalogue" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
          <ArrowLeft className="size-4" /> Catalogue
        </Link>
      </Reveal>

      <div className="grid gap-8 lg:grid-cols-2">
        <Reveal variant="zoom" className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.title} className="mx-auto aspect-square w-full object-contain p-6" />
          ) : (
            <div className="flex aspect-square items-center justify-center text-slate-300">
              <Package className="size-16" />
            </div>
          )}
        </Reveal>

        <Reveal variant="up" delay={80} className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Catalogue MadaColis
              {product.categoryPath ? ` · ${product.categoryPath}` : ""}
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-snug text-slate-900 dark:text-white">{product.title}</h1>
            {product.priceEUR != null ? (
              <div className="mt-3">
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(product.priceEUR, "EUR")}</p>
                <p className="mt-0.5 text-sm font-medium text-slate-500">≈ {formatAriary(product.priceEUR)}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Prix à confirmer sur la boutique</p>
            )}
            {product.weightKg != null && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Package className="size-3.5" />
                Poids réel : {product.weightKg} kg
                {product.lengthCm != null ? ` · ${product.lengthCm} × ${product.widthCm} × ${product.heightCm} cm` : ""}
              </p>
            )}
          </div>

          {product.features.length > 0 && (
            <ul className="space-y-1.5 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              {product.features.slice(0, 6).map((f, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-blue-600">✓</span> {f}
                </li>
              ))}
            </ul>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Truck className="size-4 text-blue-600" /> Livraison vers Madagascar
              </h2>
              {selectedTransitaire && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <Clock className="size-3.5" /> {shippingMethod === "AIR" ? selectedTransitaire.airDays : selectedTransitaire.seaDays} j
                </span>
              )}
            </div>

            <div className="p-5">
              <Segmented
                value={shippingMethod}
                onChange={(v) => onConfigChange(() => setShippingMethod(v))}
                size="lg"
                options={[
                  {
                    value: "AIR",
                    label: (
                      <span className="flex items-center gap-1.5">
                        <Plane className="size-4" /> Aérien
                        {selectedTransitaire && (
                          <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            {formatAr(selectedTransitaire.airPerKgAr)}/kg
                          </span>
                        )}
                      </span>
                    ),
                  },
                  {
                    value: "SEA",
                    label: (
                      <span className="flex items-center gap-1.5">
                        <Ship className="size-4" /> Maritime
                        {selectedTransitaire && (
                          <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                            {formatAr(selectedTransitaire.seaPerM3Ar)}/m³
                          </span>
                        )}
                      </span>
                    ),
                  },
                ]}
              />

              <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
                <DetailRow icon={MapPin} label="Destination">
                  {destinationCity}, Madagascar
                </DetailRow>
                <DetailRow icon={Building2} label="Transporteur">
                  <select
                    value={transitaireId}
                    onChange={(e) => onConfigChange(() => setTransitaireId(e.target.value))}
                    className={selectCellClass}
                    aria-label="Transporteur"
                  >
                    {transitaires.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.shortName} · {formatAr(t.airPerKgAr)}/kg
                      </option>
                    ))}
                  </select>
                </DetailRow>
                <DetailRow icon={Layers} label="Service">
                  <select
                    value={serviceType}
                    onChange={(e) => onConfigChange(() => setServiceType(e.target.value as ServiceType))}
                    className={selectCellClass}
                    aria-label="Service"
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="EXPRESS">Express</option>
                    <option value="ECONOMY">Économique</option>
                  </select>
                </DetailRow>
                <DetailRow icon={Weight} label="Poids réel">
                  {weightKg} kg
                </DetailRow>
                <DetailRow icon={Ruler} label="Dimensions">
                  {lengthCm} × {widthCm} × {heightCm} cm
                </DetailRow>
                <DetailRow icon={Package} label="Quantité">× {quantity}</DetailRow>
              </div>

              <div className="mt-4">
                {quoteLoading ? (
                  <div className="animate-pulse rounded-2xl bg-slate-100 p-5 dark:bg-slate-800">
                    <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-3 h-8 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="mt-3 h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                ) : quote ? (
                  <div
                    key={`${quote.shippingMethod}-${quote.transitaireId}`}
                    className="animate-pop overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-br from-brand-900 to-brand-950 p-5 text-white shadow-lg dark:border-blue-800"
                  >
                    <div className="animate-fade-up flex items-center justify-between gap-2 text-sm text-brand-200">
                      <span className="flex items-center gap-2 font-medium text-white">
                        <span
                          className={cn(
                            "flex size-7 items-center justify-center rounded-full",
                            quote.shippingMethod === "SEA" ? "bg-sky-500/20" : "bg-blue-500/20",
                          )}
                        >
                          {quote.shippingMethod === "SEA" ? <Ship className="size-4" /> : <Plane className="size-4" />}
                        </span>
                        {quote.transitaireName ?? "MadaColis Express"} · {quote.estimatedDeliveryDays} j
                      </span>
                      <span className="flex items-center gap-2">
                        <MapPin className="size-4" /> {quote.distanceKm.toLocaleString("fr-FR")} km
                      </span>
                    </div>

                    <div className="animate-fade-up mt-4 grid grid-cols-2 gap-2 rounded-xl bg-white/10 p-4 text-sm" style={{ animationDelay: "70ms" }}>
                      <div>
                        <p className="text-xs text-brand-300">Tarif facturé</p>
                        <p className="mt-0.5 font-semibold text-white">
                          {quote.shippingMethod === "SEA"
                            ? `${quote.billingM3} m³ × ${formatAr(quote.ratePerM3Ar ?? 0)}`
                            : `${quote.billingWeight} kg × ${formatAr(quote.ratePerKgAr ?? 0)}`}
                        </p>
                        <p className="text-xs text-brand-300">
                          ({quote.shippingMethod === "SEA" ? `${quote.pricePerM3} €/m³` : `${quote.pricePerKg} €/kg`}
                          {quote.usingVolumetric ? " · volumétrique" : ""})
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-brand-300">Livraison</p>
                        <p className="mt-0.5 text-xl font-bold text-blue-300">{formatAr(quote.priceAr ?? 0)}</p>
                        <p className="text-xs text-brand-300">≈ {formatCurrency(quote.price, quote.currency)}</p>
                      </div>
                    </div>

                    <div className="animate-fade-up mt-4 flex items-center justify-between gap-2 text-xs text-brand-200" style={{ animationDelay: "140ms" }}>
                      <p>
                        + {formatCurrency(product.priceEUR ?? 0, "EUR")} ({formatAriary(product.priceEUR ?? 0)}) d'achat
                        {quote.isFragile && ` · fragile +${formatAr(quote.breakdown.fragileSurchargeAr ?? 0)}`}
                      </p>
                      <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[11px] font-medium">estimé · non contractuel</span>
                    </div>

                    {quote.isFragile && (
                      <div className="animate-fade-up mt-3 flex items-center gap-2 rounded-xl bg-amber-400/15 px-3 py-2 text-xs text-amber-100" style={{ animationDelay: "180ms" }}>
                        <ShieldCheck className="size-4 shrink-0" /> Produit fragile / précieux pris en charge avec soin (+15 %).
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900">
                    Choisissez votre transport (aérien / maritime) puis cliquez sur{" "}
                    <strong className="text-slate-600">« Calculer la livraison »</strong> pour afficher le devis.
                  </div>
                )}
              </div>

              <Button fullWidth className="mt-4 btn-shine" onClick={() => void computeQuote()} loading={quoteLoading}>
                <Truck className="size-4" /> Calculer la livraison
              </Button>
              <p className="mt-2 text-center text-xs text-slate-400">
                Cliquez sur « Calculer la livraison » pour afficher votre budget réel.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="primary" size="lg" fullWidth onClick={handleAddToCart} className="btn-shine">
              <ShoppingCart className="size-4" /> Ajouter au panier
            </Button>
            <Link to={`/dashboard/shipments/create?link=${encodeURIComponent(product.url)}`} className="sm:w-1/2">
              <Button variant="outline" size="lg" fullWidth className="btn-shine">
                Commander <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>

      <Modal open={cartModalOpen} onClose={() => setCartModalOpen(false)} title="Ajouté au panier" maxWidth="md">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="animate-pop flex size-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40">
            <ShoppingCart className="size-7" />
          </span>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white">{quantity} × {product.title}</strong> a été ajouté à votre panier.
          </p>
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Button variant="primary" fullWidth onClick={() => setCartModalOpen(false)}>
              Continuer mes achats
            </Button>
            <Link to="/panier" className="w-full" onClick={() => setCartModalOpen(false)}>
              <Button variant="outline" fullWidth>Voir le panier</Button>
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}