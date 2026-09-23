import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link2, PackagePlus, PencilLine, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/utils";
import { api } from "@/services/api";
import type { AnalyzedProduct, ProductQuote } from "@/types";

export interface LinkOrderResult {
  analyzed: AnalyzedProduct;
  specs: { weightKg: string; lengthCm: string; widthCm: string; heightCm: string; declaredValueEUR: string };
}

export function LinkOrderPanel({ onSelect, initialUrl }: { onSelect: (result: LinkOrderResult) => void; initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [analyzed, setAnalyzed] = useState<AnalyzedProduct | null>(null);
  const [error, setError] = useState("");
  const [specs, setSpecs] = useState({ weightKg: "", lengthCm: "", widthCm: "", heightCm: "", declaredValueEUR: "" });

  const mutation = useMutation({
    mutationFn: async (link: string) => {
      const res = await api<{ product: AnalyzedProduct }>("/pricing/analyze-link", { method: "POST", body: { url: link } });
      return res.product;
    },
    onSuccess: (product) => {
      setAnalyzed(product);
      setError("");
      setSpecs({
        weightKg: "",
        lengthCm: "",
        widthCm: "",
        heightCm: "",
        declaredValueEUR: product.priceEUR ? String(product.priceEUR) : "",
      });
    },
    onError: (err) => {
      setAnalyzed(null);
      setError(err instanceof Error ? err.message : "Impossible d'analyser ce lien.");
    },
  });

  useEffect(() => {
    if (initialUrl?.trim()) mutation.mutate(initialUrl.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);

  const validSpecs = () =>
    Number.parseFloat(specs.weightKg) > 0 &&
    Number.parseFloat(specs.lengthCm) > 0 &&
    Number.parseFloat(specs.widthCm) > 0 &&
    Number.parseFloat(specs.heightCm) > 0;

  const addItem = (withLink: boolean) => {
    if (!analyzed || !validSpecs()) return;
    onSelect({
      analyzed,
      specs: {
        weightKg: specs.weightKg,
        lengthCm: specs.lengthCm,
        widthCm: specs.widthCm,
        heightCm: specs.heightCm,
        declaredValueEUR: Number.parseFloat(specs.declaredValueEUR) > 0 ? specs.declaredValueEUR : "0",
      },
    });
    if (!withLink) {
      setAnalyzed(null);
      setUrl("");
    }
  };

  const quote = useMutation({
    mutationFn: async () => {
      const res = await api<{ quote: ProductQuote["quote"] }>("/pricing/product-quote", {
        method: "POST",
        body: {
          link: url.trim(),
          title: analyzed?.title,
          quantity: 1,
          weightKg: Number(specs.weightKg),
          lengthCm: specs.lengthCm ? Number(specs.lengthCm) : undefined,
          widthCm: specs.widthCm ? Number(specs.widthCm) : undefined,
          heightCm: specs.heightCm ? Number(specs.heightCm) : undefined,
          declaredValueEUR: specs.declaredValueEUR ? Number(specs.declaredValueEUR) : undefined,
          destinationCountry: "Madagascar",
          destinationCity: "Antananarivo",
          serviceType: "STANDARD",
        },
      });
      return res.quote;
    },
  });

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          <Link2 className="mr-1.5 inline size-4 text-blue-600" />
          Commander depuis un lien produit
        </h2>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="flex items-start gap-2">
          <Input
            label="Collez le lien du produit"
            placeholder="https://…  (Amazon, AliExpress, Alibaba…)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && url.trim() && mutation.mutate(url.trim())}
          />
          <Button
            className="mt-6 shrink-0"
            loading={mutation.isPending}
            disabled={!url.trim()}
            onClick={() => mutation.mutate(url.trim())}
          >
            Analyser
          </Button>
        </div>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}

        {analyzed && (
          <div className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Produit en ligne
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white">{analyzed.title}</p>
                {analyzed.priceEUR != null && <p className="mt-1 text-sm font-bold text-blue-600">{formatCurrency(analyzed.priceEUR, "EUR")}</p>}
              </div>
              <div className="flex gap-2">
                {analyzed.priceEUR != null && (
                  <Button size="sm" variant="outline" loading={quote.isPending} onClick={() => quote.mutate()}>
                    Frais livraison
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => { setAnalyzed(null); setUrl(""); }} aria-label="Fermer">
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {quote.data && (
              <div className="rounded-xl bg-brand-900 p-4 text-white">
                <p className="text-xs text-brand-200">Frais de livraison calculés (Standard, vers Antananarivo)</p>
                <p className="mt-1 text-xl font-bold text-blue-300">
                  {formatCurrency(quote.data.price, quote.data.currency)} · {quote.data.distanceKm.toLocaleString("fr-FR")} km · poids facturé {quote.data.billingWeight} kg
                </p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-5">
              <Input label="Poids (kg)" type="number" inputMode="decimal" placeholder="0.5" value={specs.weightKg} onChange={(e) => setSpecs({ ...specs, weightKg: e.target.value })} />
              <Input label="Long. (cm)" type="number" inputMode="decimal" placeholder="20" value={specs.lengthCm} onChange={(e) => setSpecs({ ...specs, lengthCm: e.target.value })} />
              <Input label="Larg. (cm)" type="number" inputMode="decimal" placeholder="15" value={specs.widthCm} onChange={(e) => setSpecs({ ...specs, widthCm: e.target.value })} />
              <Input label="Haut. (cm)" type="number" inputMode="decimal" placeholder="10" value={specs.heightCm} onChange={(e) => setSpecs({ ...specs, heightCm: e.target.value })} />
              <Input label="Valeur (EUR)" type="number" inputMode="decimal" placeholder="0" value={specs.declaredValueEUR} onChange={(e) => setSpecs({ ...specs, declaredValueEUR: e.target.value })} />
            </div>
            <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <PencilLine className="size-3.5" />
              Renseignez le poids et les dimensions — le frais de livraison en dépend directement.
            </p>

            <Button disabled={!validSpecs()} onClick={() => addItem(true)}>
              <PackagePlus className="size-4" /> Ajouter cet article à l'envoi
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}