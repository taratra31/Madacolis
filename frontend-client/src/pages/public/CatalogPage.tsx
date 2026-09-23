import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, FolderTree, Package, PackageSearch, Shirt, ShoppingBag, Store, X } from "lucide-react";
import { AmazonSearchPanel, AlibabaPastePanel } from "@/components/catalog/MarketplaceSearch";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { useLocale } from "@/contexts/locale";
import { api } from "@/services/api";
import { cn } from "@/utils";
import type { AmazonProduct, CatalogProductType, CategoryNode } from "@/types";

type Tab = "amazon" | "alibaba";

function toCard(p: AmazonProduct): CatalogProductType {
  return {
    id: p.asin,
    name: p.title,
    brand: "",
    category: p.category ?? "",
    priceEUR: p.priceEUR ?? 0,
    weightKg: p.weightKg ?? 0.5,
    lengthCm: p.lengthCm ?? 20,
    widthCm: p.widthCm ?? 15,
    heightCm: p.heightCm ?? 10,
    image: p.imageUrl ?? "",
    description: "",
  };
}

export function CatalogPage() {
  const { t } = useLocale();
  const [searchParams] = useSearchParams();
  const initialTab: Tab = searchParams.get("source") === "alibaba" ? "alibaba" : "amazon";
  const initialQuery = searchParams.get("q") ?? "";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [category, setCategory] = useState("");

  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<{ categories: CategoryNode[] }>("/pricing/marketplace/categories"),
  });
  const categories = data?.categories ?? [];

  const [listingLimit, setListingLimit] = useState(24);
  const { data: listing, isFetching: listingFetching } = useQuery({
    queryKey: ["catalog-all", category, listingLimit],
    queryFn: () =>
      api<{ products: AmazonProduct[]; total: number }>("/pricing/marketplace/products", {
        params: { limit: listingLimit, category: category || undefined },
      }),
  });
  const listingProducts = listing?.products ?? [];
  const listingTotal = listing?.total ?? 0;

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-blue-950 py-12 text-white">
        <div className="pointer-events-none absolute inset-0 bg-grid-light opacity-50" />
        <div className="pointer-events-none absolute -right-20 -top-16 size-72 animate-blob bg-blue-500/15 blur-3xl" />
        <div className="container-page relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-300">
            <Store className="size-3.5" /> {t("pages.catalog.badge")}
          </span>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            {t("pages.catalog.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-slate-300">{t("pages.catalog.subtitle")}</p>
        </div>
      </section>

      <section className="container-page py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <FolderTree className="size-4 text-blue-600" /> {t("pages.catalog.categories")}
              </h2>
              <nav className="mt-4 space-y-3">
                {categories.map((cat) => (
                  <div key={cat.slug}>
                    <div className="flex items-center justify-between text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                      <span>{cat.name}</span>
                      <span className="rounded-full bg-slate-100 px-1.5 text-[11px] text-slate-500 dark:bg-slate-800">{cat.productCount}</span>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {cat.children.map((child) => (
                        <button
                          key={child.slug}
                          onClick={() => setCategory(category === child.slug ? "" : child.slug)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-[13px] transition",
                            category === child.slug
                              ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
                          )}
                        >
                          <span className="truncate">{child.name}</span>
                          <span className="ml-1 shrink-0 text-[11px] text-slate-400">{child.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
              {category && (
                <button
                  onClick={() => setCategory("")}
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-400 dark:border-slate-700 dark:text-slate-300"
                >
                  <X className="size-3.5" /> {t("pages.catalog.clearFilter")}
                </button>
              )}
            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="mb-6 flex flex-wrap gap-2">
              {(
                [
                  { id: "amazon", label: t("pages.catalog.tabSearch"), icon: ShoppingBag },
                  { id: "alibaba", label: t("pages.catalog.tabPaste"), icon: Store },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition",
                    tab === item.id
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                  )}
                >
                  <item.icon className="size-4" /> {item.label}
                </button>
              ))}
            </div>

            {tab === "amazon" ? (
              <>
                <AmazonSearchPanel initialQuery={initialQuery} />

                <div className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                      <Shirt className="size-5 text-blue-600" /> {t("pages.catalog.allProducts")}
                    </h2>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      {listingTotal.toLocaleString("fr-FR")} {t("pages.catalog.items")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("pages.catalog.listingNote")}</p>
                  {listingFetching ? (
                    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
                  ) : (
                    <Reveal>
                      <ProductGrid products={listingProducts.map(toCard)} className="mt-6" />
                    </Reveal>
                  )}
                  {listing && listingProducts.length < listingTotal ? (
                    <div className="mt-8 flex flex-col items-center gap-2">
                      <Button variant="outline" onClick={() => setListingLimit((n) => n + 24)} loading={listingFetching}>
                        <ArrowDown className="size-4" /> {t("pages.catalog.viewMore")} ({listingProducts.length}/{listingTotal})
                      </Button>
                    </div>
                  ) : (
                    listingTotal > 0 && (
                      <p className="mt-8 text-center text-xs font-medium text-blue-600">
                        {t("pages.catalog.allShown")} ({listingTotal.toLocaleString("fr-FR")}).
                      </p>
                    )
                  )}
                </div>
              </>
            ) : (
              <AlibabaPastePanel />
            )}

            <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/40">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <PackageSearch className="size-4 text-blue-600" /> {t("pages.catalog.alreadyFoundTitle")}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("pages.catalog.alreadyFoundText")}</p>
              <Link to="/dashboard/shipments/create" className="mt-3 inline-block">
                <Button variant="outline" size="sm">
                  <Package className="size-4" /> {t("common.createShipment")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}