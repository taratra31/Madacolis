import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
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
  ShoppingCart,
  Truck,
  Weight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Modal } from "@/components/ui/Modal";
import { Reveal } from "@/components/ui/Reveal";
import { useCart } from "@/contexts/cart";
import { formatAr, formatCurrency, cn, CITIES_DEPART } from "@/utils";
import { api } from "@/services/api";
import type { CatalogProductType, ProductQuote, Quote, ServiceType, ShippingMethod, Transitaire } from "@/types";

const selectCellClass =
  "h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

function Row({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
      <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Icon className="size-4 text-blue-600 dark:text-blue-400" /> {label}
      </span>
      <span className="flex items-center gap-2 text-right font-medium text-slate-800 dark:text-slate-100">{children}</span>
    </div>
  );
}

export function ProductCard({ product, className }: { product: CatalogProductType; className?: string }) {
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("AIR");
  const [serviceType, setServiceType] = useState<ServiceType>("STANDARD");
  const [quantity, setQuantity] = useState(1);
  const [destinationCity, setDestinationCity] = useState("Antananarivo");
  const [transitaireId, setTransitaireId] = useState("madacolis");
  const [transitaires, setTransitaires] = useState<Transitaire[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    if (!open) return;
    let alive = true;
    api<{ transitaires: Transitaire[] }>("/pricing/marketplace/transitaires")
      .then((d) => alive && setTransitaires(d.transitaires))
      .catch(() => alive && setTransitaires([]));
    return () => {
      alive = false;
    };
  }, [open]);

  const selectedTransitaire = transitaires.find((t) => t.id === transitaireId) ?? transitaires[0];

  const onConfig = (updater: () => void) => {
    setQuote(null);
    updater();
  };

  const runQuote = async () => {
    setLoading(true);
    try {
      const res = await api<ProductQuote>("/pricing/product-quote", {
        method: "POST",
        body: {
          title: product.name,
          quantity,
          weightKg: product.weightKg,
          lengthCm: product.lengthCm,
          widthCm: product.widthCm,
          heightCm: product.heightCm,
          declaredValueEUR: product.priceEUR,
          destinationCountry: "Madagascar",
          destinationCity,
          serviceType,
          shippingMethod,
          transitaireId,
        },
      });
      setQuote(res.quote);
    } catch {
      setQuote(null);
    } finally {
      setLoading(false);
    }
  };

  const totalAr = quote?.priceAr ?? 0;
  const totalEur = (quote?.price ?? 0) + product.priceEUR;

  return (
    <>
      <div className={cn("group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900", className)}>
        <Link to={`/produit/${encodeURIComponent(product.id)}`} className="relative block aspect-square overflow-hidden bg-slate-100" aria-label={`Voir les détails de ${product.name}`}>
          {product.badge && (
            <span
              className={cn(
                "absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
                product.badge === "PROMO" ? "bg-red-600" : product.badge === "BESTSELLER" ? "bg-amber-500" : "bg-sky-500",
              )}
            >
              {product.badge}
            </span>
          )}
          <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        </Link>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {product.brand && product.brand.trim() ? `${product.brand} · ` : ""}
            {product.category}
          </p>
          <Link to={`/produit/${encodeURIComponent(product.id)}`} className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-slate-900 transition group-hover:text-blue-700 dark:text-white dark:hover:text-blue-400">
            {product.name}
          </Link>
          <p className="text-sm text-slate-400">
            {product.weightKg} kg · {product.lengthCm}×{product.widthCm}×{product.heightCm} cm
          </p>
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(product.priceEUR, "EUR")}</span>
              <span className="text-xs text-slate-400">≈ {formatAr(product.priceEUR * 5000)}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  addItem({
                    productId: product.id,
                    name: product.name,
                    imageUrl: product.image,
                    price: product.priceEUR,
                    quantity: 1,
                    weightKg: product.weightKg,
                    lengthCm: product.lengthCm,
                    widthCm: product.widthCm,
                    heightCm: product.heightCm,
                    marketplace: "UNKNOWN",
                    sourceUrl: "",
                  })
                }
                className="rounded-xl p-2 text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-950/30"
                aria-label="Ajouter au panier"
                title="Ajouter au panier"
              >
                <ShoppingCart className="size-4" />
              </button>
              <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                <Package className="size-4" /> Livraison
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Frais de livraison" maxWidth="lg">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src={product.image} alt={product.name} className="size-16 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900 dark:text-white">{product.name}</p>
              <p className="text-sm font-bold text-blue-600">{formatCurrency(product.priceEUR, "EUR")}</p>
              <p className="text-xs text-slate-400">
                {product.weightKg} kg · {product.lengthCm}×{product.widthCm}×{product.heightCm} cm (France → Madagascar)
              </p>
            </div>
          </div>

          <Segmented
            value={shippingMethod}
            onChange={(v) => onConfig(() => setShippingMethod(v))}
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

          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
            <Row icon={MapPin} label="Destination">
              <select value={destinationCity} onChange={(e) => onConfig(() => setDestinationCity(e.target.value))} className={selectCellClass} aria-label="Destination">
                {CITIES_DEPART.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Row>
            <Row icon={Building2} label="Transporteur">
              <select value={transitaireId} onChange={(e) => onConfig(() => setTransitaireId(e.target.value))} className={selectCellClass} aria-label="Transporteur">
                {transitaires.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.shortName} · {formatAr(t.airPerKgAr)}/kg
                  </option>
                ))}
              </select>
            </Row>
            <Row icon={Layers} label="Service">
              <select value={serviceType} onChange={(e) => onConfig(() => setServiceType(e.target.value as ServiceType))} className={selectCellClass} aria-label="Service">
                <option value="STANDARD">Standard</option>
                <option value="EXPRESS">Express</option>
                <option value="ECONOMY">Économique</option>
              </select>
            </Row>
            <Row icon={Weight} label="Poids réel">{product.weightKg} kg</Row>
            <Row icon={Ruler} label="Dimensions">{product.lengthCm}×{product.widthCm}×{product.heightCm} cm</Row>
            <Row icon={Package} label="Quantité">
              <select value={quantity} onChange={(e) => onConfig(() => setQuantity(Number(e.target.value)))} className={selectCellClass} aria-label="Quantité">
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>× {n}</option>
                ))}
              </select>
            </Row>
          </div>

          <Button fullWidth onClick={() => void runQuote()} loading={loading}>
            <Truck className="size-4" /> Calculer la livraison
          </Button>
          <p className="text-center text-xs text-slate-400">Cliquez pour afficher le budget réel de livraison.</p>

          <div>
            {loading ? (
              <div className="animate-pulse rounded-2xl bg-slate-100 p-5 dark:bg-slate-800">
                <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-3 h-8 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ) : quote ? (
              <div key={`${quote.shippingMethod}-${quote.transitaireId}`} className="animate-pop overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-br from-brand-900 to-brand-950 p-5 text-white shadow-lg dark:border-blue-800">
                <div className="animate-fade-up flex flex-wrap items-center justify-between gap-2 text-sm text-brand-200">
                  <span className="flex items-center gap-2 font-medium text-white">
                    <span className={`flex size-7 items-center justify-center rounded-full ${quote.shippingMethod === "SEA" ? "bg-sky-500/20" : "bg-blue-500/20"}`}>
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
                    <p className="mt-0.5 text-xl font-bold text-blue-300">{formatAr(totalAr)}</p>
                    <p className="text-xs text-brand-300">≈ {formatCurrency(quote.price, quote.currency)}</p>
                  </div>
                </div>

                <div className="animate-fade-up mt-4 flex items-center justify-between gap-2 text-xs text-brand-200" style={{ animationDelay: "140ms" }}>
                  <p>
                    + {formatCurrency(product.priceEUR, "EUR")} d'achat
                    {quote.isFragile && ` · fragile +${formatAr(quote.breakdown.fragileSurchargeAr ?? 0)}`}
                  </p>
                  <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-blue-200">
                    Total ≈ {formatCurrency(totalEur, "EUR")}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900">
                  <Clock className="mx-auto mb-2 size-5" /> Cliquez sur « Calculer la livraison » pour afficher votre budget.
                </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            onClick={() =>
              addItem({
                productId: product.id,
                name: product.name,
                imageUrl: product.image,
                price: product.priceEUR,
                quantity,
                weightKg: product.weightKg,
                lengthCm: product.lengthCm,
                widthCm: product.widthCm,
                heightCm: product.heightCm,
                marketplace: "UNKNOWN",
                sourceUrl: "",
              })
            }
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            <ShoppingCart className="size-4" /> Ajouter au panier
          </button>
          <Link to="/dashboard/shipments/create" className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
            Commander <ArrowRight className="size-4" />
          </Link>
        </div>
      </Modal>
    </>
  );
}

export function ProductGrid({ products, className }: { products: CatalogProductType[]; className?: string }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-400">
        <Loader2 className="size-5 animate-spin" />
        Aucun produit trouvé.
      </div>
    );
  }
  return (
    <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4", className)}>
      {products.map((product, i) => (
        <Reveal key={product.id} delay={(i % 8) * 60} variant="up">
          <ProductCard product={product} />
        </Reveal>
      ))}
    </div>
  );
}