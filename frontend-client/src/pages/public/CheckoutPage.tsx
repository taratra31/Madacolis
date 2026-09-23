import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CreditCard, Plane, Ship, Smartphone, ShoppingBag, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { useCart } from "@/contexts/cart";
import { useAuth } from "@/contexts/auth";
import { formatAriary, formatCurrency } from "@/utils";
import type { ShippingMethod } from "@/types";

const STRIPE_PAYMENT_LINK = import.meta.env.VITE_STRIPE_PAYMENT_LINK as string | undefined;

export function CheckoutPage() {
  const { items, totalItems, totalPrice, totalWeight, clearCart } = useCart();
  const { user } = useAuth();
  const [method, setMethod] = useState<"stripe" | "mvola" | "om">("stripe");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("AIR");
  const [paid, setPaid] = useState(false);

  if (items.length === 0 && !paid) {
    return (
      <div className="container-page py-16 text-center">
        <Reveal variant="zoom">
          <ShoppingBag className="mx-auto size-16 animate-float text-slate-300 dark:text-slate-600" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Panier vide</h1>
          <Link to="/catalogue" className="mt-6 inline-flex"><Button variant="primary">Parcourir le catalogue</Button></Link>
        </Reveal>
      </div>
    );
  }

  const airPerKg = 15;
  const seaPerM3 = 50;
  const handlingEur = 4;
  const volumeM3 = items.reduce((sum, it) => {
    if (it.lengthCm && it.widthCm && it.heightCm) return sum + ((it.lengthCm * it.widthCm * it.heightCm) / 1_000_000) * it.quantity;
    return sum + (it.weightKg * it.quantity) / 300;
  }, 0);
  const shippingEstimate =
    Math.round(((shippingMethod === "SEA" ? volumeM3 * seaPerM3 : totalWeight * airPerKg) + handlingEur) * 100) / 100;
  const totalEstimate = totalPrice + shippingEstimate;

  const handlePay = () => {
    if (method === "stripe" && STRIPE_PAYMENT_LINK) {
      const params = new URLSearchParams({
        "client_reference_id": `MADACOLIS-${Date.now()}`,
        "prefilled_email": user?.email ?? "",
      });
      window.open(`${STRIPE_PAYMENT_LINK}?${params.toString()}`, "_blank");
      setPaid(true);
      clearCart();
    } else if (method === "stripe" && !STRIPE_PAYMENT_LINK) {
      alert("Le lien de paiement Stripe n'est pas encore configuré. Contactez l'administrateur.");
    } else {
      setPaid(true);
      clearCart();
    }
  };

  if (paid) {
    return (
      <div className="container-page py-16 text-center">
        <Reveal variant="zoom">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
            <ShieldCheck className="size-8 animate-pulse-soft text-blue-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Commande confirmée !</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            {method === "stripe"
              ? "Un email de confirmation Stripe vous sera envoyé."
              : "Votre commande sera traitée après réception du paiement mobile."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/dashboard"><Button variant="primary">Mon espace</Button></Link>
            <Link to="/catalogue"><Button variant="outline">Continuer mes achats</Button></Link>
          </div>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <Reveal variant="fade">
        <Link to="/cart" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
          <ArrowLeft className="size-4" /> Retour au panier
        </Link>
      </Reveal>
      <Reveal variant="fade" delay={50}>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Validation de la commande</h1>
      </Reveal>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Reveal variant="up" className="card-lift rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-semibold text-slate-900 dark:text-white">Articles ({totalItems})</h2>
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="size-14 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800"><ShoppingBag className="size-5 text-slate-300" /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-500">Qté : {item.quantity} × {formatCurrency(item.price, "EUR")}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(item.price * item.quantity, "EUR")}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal variant="up" delay={90} className="card-lift rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-semibold text-slate-900 dark:text-white">Moyen de paiement</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { key: "stripe" as const, label: "Stripe (carte)", icon: CreditCard, desc: "Visa, Mastercard" },
                { key: "mvola" as const, label: "MVola", icon: Smartphone, desc: "Paiement mobile" },
                { key: "om" as const, label: "Orange Money", icon: Smartphone, desc: "Paiement mobile" },
              ].map((opt) => (
                <button key={opt.key} onClick={() => setMethod(opt.key)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-4 text-center transition ${
                    method === opt.key ? "animate-pop border-blue-600 bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 hover:-translate-y-0.5 hover:border-blue-300 dark:border-slate-700"
                  }`}>
                  <opt.icon className="size-6 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{opt.label}</span>
                  <span className="text-xs text-slate-500">{opt.desc}</span>
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-1">
          <Reveal variant="left" delay={140} className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="font-semibold text-slate-900 dark:text-white">Récapitulatif</h2>
            <h2 className="font-semibold text-slate-900 dark:text-white">Mode de transport</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { key: "AIR" as const, label: "Avion", icon: Plane, desc: "~7 500 Ar/kg · 7 j" },
                { key: "SEA" as const, label: "Bateau", icon: Ship, desc: "~250 000 Ar/m³ · 35 j" },
              ].map((opt) => (
                <button key={opt.key} onClick={() => setShippingMethod(opt.key)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-4 text-center transition ${
                    shippingMethod === opt.key ? "animate-pop border-blue-600 bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 hover:-translate-y-0.5 hover:border-blue-300 dark:border-slate-700"
                  }`}>
                  <opt.icon className="size-6 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{opt.label}</span>
                  <span className="text-xs text-slate-500">{opt.desc}</span>
                </button>
              ))}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Produits ({totalItems})</span><span>{formatCurrency(totalPrice, "EUR")}</span></div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Livraison estimée (MadaColis)</span>
                <span>{formatCurrency(shippingEstimate, "EUR")}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>{shippingMethod === "SEA" ? `Volume ${volumeM3.toFixed(2)} m³` : `Poids ${totalWeight.toFixed(1)} kg`}</span>
                <span>≈ {formatAriary(shippingEstimate)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 dark:border-slate-700" />
              <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                <span>Total estimé</span>
                <span className="flex flex-col items-end leading-tight">
                  {formatCurrency(totalEstimate, "EUR")}
                  <span className="text-xs font-medium text-slate-500">≈ {formatAriary(totalEstimate)}</span>
                </span>
              </div>
            </div>
            <Button variant="primary" fullWidth size="lg" onClick={handlePay} className="btn-shine">
              Payer {formatCurrency(totalEstimate, "EUR")}
            </Button>
            <p className="text-center text-xs text-slate-400">Livraison calculée précisément après validation</p>
          </Reveal>
        </div>
      </div>
    </div>
  );
}