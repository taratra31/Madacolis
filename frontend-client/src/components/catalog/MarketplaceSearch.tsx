import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Info, Link2, Package, Search, ShoppingBag, ShoppingCart, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCart } from "@/contexts/cart";
import { api } from "@/services/api";
import { formatAriary, formatCurrency } from "@/utils";
import type { AmazonProduct, AnalyzedProduct } from "@/types";

interface AmazonSearchResponse {
  products: AmazonProduct[];
  source?: "paapi" | "curated";
}

export function AmazonSearchPanel({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [active, setActive] = useState(initialQuery);

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["amazon-search", active],
    queryFn: () =>
      api<AmazonSearchResponse>("/pricing/marketplace/amazon/search", {
        params: { q: active, limit: 20 },
      }),
    enabled: active.trim().length > 0,
  });

  const products = data?.products ?? [];
  const curated = data?.source === "curated";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setActive(query.trim());
  };

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="flex items-start gap-2">
        <Input
          label="Rechercher un produit"
          placeholder="Ex : iPhone 15, robot cuiseur, sneakers…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button className="mt-6 shrink-0" loading={isFetching} onClick={() => setActive(query.trim())} disabled={!query.trim()}>
          <Search className="size-4" /> Rechercher
        </Button>
      </form>

      {active.trim().length === 0 ? null : curated ? (
        <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            Produits réels de notre catalogue : titre, photo, prix, poids et dimensions. Toutes les boutiques en ligne y sont déjà référencées.
          </span>
        </div>
      ) : null}

      {isError ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">
          Impossible de charger les produits.{" "}
          <button className="font-semibold underline" onClick={() => void refetch()}>Réessayer</button>
        </p>
      ) : isFetching ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="aspect-square bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-2 p-4">
                <div className="h-3 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400 dark:bg-slate-800/50">Aucun résultat pour « {active} ».</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <AmazonProductCard key={product.asin} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function AmazonProductCard({ product }: { product: AmazonProduct }) {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      productId: product.asin,
      name: product.title,
      imageUrl: product.imageUrl,
      price: product.priceEUR ?? 0,
      quantity: 1,
      weightKg: 0.5,
      lengthCm: 20,
      widthCm: 15,
      heightCm: 10,
      marketplace: "AMAZON",
      sourceUrl: product.url,
    });
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <Link to={`/produit/${encodeURIComponent(product.asin)}`} className="block aspect-square overflow-hidden bg-slate-100">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Package className="size-8" />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <Link to={`/produit/${encodeURIComponent(product.asin)}`}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-slate-800 transition group-hover:text-blue-700 dark:text-slate-100">{product.title}</h3>
        </Link>
        {product.categoryPath && (
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-400">{product.category}</p>
        )}
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          {product.priceEUR != null ? (
            <span className="flex flex-col">
              <span>{formatCurrency(product.priceEUR, "EUR")}</span>
              <span className="text-xs font-medium text-slate-400">≈ {formatAriary(product.priceEUR)}</span>
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-400">Prix à confirmer</span>
          )}
        </p>
        <div className="mt-auto flex flex-col gap-1.5">
          <button onClick={handleAddToCart} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-600 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-950/30">
            <ShoppingCart className="size-4" /> Ajouter au panier
          </button>
          <Link to={`/dashboard/shipments/create?link=${encodeURIComponent(product.url)}`} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
            Commander <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AlibabaPastePanel() {
  const [url, setUrl] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [error, setError] = useState("");
  const { addItem } = useCart();

  const { data, isFetching } = useQuery({
    queryKey: ["alibaba-analyze", submitted],
    queryFn: () => api<{ product: AnalyzedProduct }>("/pricing/analyze-link", { method: "POST", body: { url: submitted } }),
    enabled: submitted.length > 0,
    retry: false,
  });

  const analyze = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!url.trim()) return;
    setSubmitted(url.trim());
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <Store className="size-5 text-blue-600" /> Coller un lien produit
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Collez le lien d'un produit commandé en ligne (Amazon, AliExpress, Alibaba…) : on analyse la page, puis vous
          renseignez le poids/dimensions au moment de la commande pour un devis exact.
        </p>
        <form onSubmit={analyze} className="mt-4 flex items-start gap-2">
          <Input
            label="Lien du produit"
            placeholder="https://… (produit en ligne)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button className="mt-6 shrink-0" type="submit" loading={isFetching} disabled={!url.trim()}>
            <Link2 className="size-4" /> Analyser
          </Button>
        </form>
        {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}
      </div>

      {data?.product && (
        <div className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            {data.product.imageUrl ? (
              <img src={data.product.imageUrl} alt="" className="size-20 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-300 dark:bg-slate-800">
                <Package className="size-8" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Produit en ligne
              </p>
              <p className="mt-1 font-semibold text-slate-900 dark:text-white">{data.product.title}</p>
              {data.product.priceEUR != null && <p className="mt-1 font-bold text-blue-600">{formatCurrency(data.product.priceEUR, "EUR")}</p>}
            </div>
            <Link to={`/dashboard/shipments/create?link=${encodeURIComponent(submitted)}`}>
              <Button variant="primary">
                <ShoppingBag className="size-4" /> Commander cet article
              </Button>
            </Link>
            <button onClick={() => addItem({
              productId: submitted,
              name: data.product.title,
              imageUrl: data.product.imageUrl,
              price: data.product.priceEUR ?? 0,
              quantity: 1,
              weightKg: 0.5,
              lengthCm: 20,
              widthCm: 15,
              heightCm: 10,
              marketplace: data.product.marketplace,
              sourceUrl: submitted,
            })} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-600 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-950/30">
              <ShoppingCart className="size-4" /> Ajouter au panier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}