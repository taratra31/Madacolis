import { Link } from "react-router-dom";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { useCart } from "@/contexts/cart";
import { formatCurrency } from "@/utils";

export function CartPage() {
  const { items, totalItems, totalPrice, totalWeight, removeItem, updateQuantity, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <Reveal variant="zoom">
          <ShoppingBag className="mx-auto size-16 animate-float text-slate-300 dark:text-slate-600" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Votre panier est vide</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Ajoutez des produits depuis le catalogue pour commencer.</p>
          <Link to="/catalogue" className="mt-6 inline-flex">
            <Button variant="primary" className="btn-shine">
              <ShoppingBag className="size-4" /> Parcourir le catalogue
            </Button>
          </Link>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <Reveal variant="fade">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mon panier ({totalItems})</h1>
      </Reveal>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, i) => (
            <Reveal key={item.id} delay={i * 60} variant="up" className="card-lift flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="size-20 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-300 dark:bg-slate-800">
                  <ShoppingBag className="size-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{item.marketplace}</p>
                    <h3 className="mt-0.5 truncate text-sm font-medium text-slate-800 dark:text-slate-100">{item.name}</h3>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40" aria-label="Supprimer">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="rounded-l-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Minus className="size-3.5" /></button>
                    <span className="min-w-[2rem] text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="rounded-r-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Plus className="size-3.5" /></button>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(item.price * item.quantity, "EUR")}</p>
                </div>
              </div>
            </Reveal>
          ))}
          <button onClick={clearCart} className="text-sm font-medium text-red-500 hover:underline">Vider le panier</button>
        </div>

        <div className="lg:col-span-1">
          <Reveal variant="left" delay={150} className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="font-semibold text-slate-900 dark:text-white">Récapitulatif</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Sous-total ({totalItems} article{totalItems > 1 ? "s" : ""})</span><span>{formatCurrency(totalPrice, "EUR")}</span></div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Poids total</span><span>{totalWeight.toFixed(1)} kg</span></div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Livraison estimée</span><span className="text-xs italic">calculée à la validation</span></div>
              <div className="border-t border-slate-200 pt-2 dark:border-slate-700" />
              <div className="flex justify-between font-bold text-slate-900 dark:text-white"><span>Total produits</span><span>{formatCurrency(totalPrice, "EUR")}</span></div>
            </div>
            <Link to="/checkout" className="block">
              <Button variant="primary" fullWidth size="lg" className="btn-shine">
                Valider la commande <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/catalogue" className="block text-center text-sm font-medium text-blue-600 hover:underline">← Continuer mes achats</Link>
          </Reveal>
        </div>
      </div>
    </div>
  );
}