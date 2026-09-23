import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  MessageCircle,
  Package,
  PackageCheck,
  PackagePlus,
  Plane,
  Plus,
  ReceiptText,
  Search,
  SearchCheck,
  Send,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { useLocale } from "@/contexts/locale";
import { CostCalculator } from "@/components/tracking/CostCalculator";
import { ProductGrid } from "@/components/catalog/ProductCard";
import { api } from "@/services/api";
import { SERVICE_DESCRIPTIONS, whatsappLink } from "@/utils";
import type { AmazonProduct, CatalogProductType, ServiceType } from "@/types";

function toCatalogProduct(p: AmazonProduct): CatalogProductType {
  const source = p.asin.split("-")[0];
  const category =
    source === "dummy"
      ? "Électronique & Mode"
      : source === "fakestore"
        ? "Mode & Maison"
        : "Épicerie France";
  return {
    id: p.asin,
    name: p.title,
    brand: "",
    category,
    priceEUR: p.priceEUR ?? 0,
    weightKg: 0.5,
    lengthCm: 20,
    widthCm: 15,
    heightCm: 10,
    image: p.imageUrl ?? "",
    description: "",
  };
}

const STEPS = [
  {
    icon: ShoppingBag,
    title: "1. Achetez en ligne",
    description: "Choisissez un produit ou collez le lien de votre boutique préférée.",
  },
  {
    icon: ClipboardList,
    title: "2. Commande enregistrée",
    description: "Nous recevons et contrôlons votre colis en France.",
  },
  {
    icon: Plane,
    title: "3. Acheminement",
    description: "Transport aérien ou maritime jusqu'à Madagascar, suivi en temps réel.",
  },
  {
    icon: PackageCheck,
    title: "4. Livraison à domicile",
    description: "Payez et recevez votre colis à Antananarivo ou dans votre ville.",
  },
];

const SERVICES: ServiceType[] = ["STANDARD", "EXPRESS", "ECONOMY"];

const QUICK_LINKS = [
  { to: "/suivi", icon: SearchCheck, label: "Suivre un colis", text: "Numéro de tracking en temps réel." },
  { to: "/#calculateur", icon: ReceiptText, label: "Estimer un prix", text: `Simulateur sans engagement, en quelques secondes.` },
  { to: "/dashboard/shipments/create", icon: Send, label: "Créer un envoi", text: "Préparez votre colis manuellement, en 4 étapes." },
];

const ADVANTAGES = [
  { icon: Truck, title: "Porte-à-porte", description: "Collecte et livraison à domicile, des deux côtés de la route." },
  { icon: Search, title: "Suivi en temps réel", description: "Un numéro de tracking unique et un historique détaillé." },
  { icon: Wallet, title: "Paiement mobile", description: "Réglez avec MVola, Orange Money, carte bancaire ou espèce." },
  { icon: ShieldCheck, title: "Colis protégés", description: "Manutention soignée et prise en charge adaptée aux fragiles." },
  { icon: BadgeCheck, title: "Tarifs transparents", description: "Frais calculés automatiquement selon poids, volume et distance." },
  { icon: MessageCircle, title: "Support 7j/7", description: "Une équipe disponible sur WhatsApp pour vous accompagner." },
];

const FAQS = [
  {
    q: "Comment suivre l'acheminement de mon colis ?",
    a: "Saisissez votre numéro de tracking (format MD-FR-2026-000001) sur la page « Suivre un colis » pour voir le statut, la position et l'historique en temps réel.",
  },
  {
    q: "Comment sont calculés les frais de livraison ?",
    a: "Les frais sont calculés automatiquement par le backend en fonction du poids, du volume du colis, de la destination et de la distance réelle (géolocalisée) entre le départ et l'arrivée. Utilisez le simulateur ou ajoutez un produit du catalogue pour une estimation immédiate.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Nous acceptons MVola, Orange Money, Airtel Money, la carte bancaire et le paiement en espèces. Le paiement se fait depuis votre espace client.",
  },
  {
    q: "Dois-je déclarer la valeur de mon colis ?",
    a: "Oui, la valeur déclarée est nécessaire pour les formalités douanières et pour pouvoir être dédommagé en cas de perte ou d'avarie.",
  },
  {
    q: "Que se passe-t-il si mon colis est fragile ?",
    a: "Indiquez « fragile » lors de la création de l'envoi : nous appliquerons une manutention particulière (marquage, calage, assurance renforcée).",
  },
  {
    q: "Puis-je annuler un envoi ?",
    a: "Oui, tant que le colis n'a pas été prise en charge, vous pouvez l'annuler depuis les détails de l'envoi dans votre espace client.",
  },
  {
    q: "Quels sont les délais de livraison ?",
    a: "En Express, comptez 3 à 5 jours ouvrés entre la France et Madagascar ; en Standard et Economy, les délais sont plus longs (7 à 15 jours). Le suivi vous indique une estimation à chaque étape.",
  },
  {
    q: "Y a-t-il un poids ou un volume maximum ?",
    a: "Chaque colis peut peser jusqu'à 500 kg et mesurer 300 cm par dimension. Pour les très grands colis, contactez-nous sur WhatsApp : nous organisons un transport adapté.",
  },
  {
    q: "Comment se passe le passage en douane ?",
    a: "Nous préparons et déclarons vos colis pour la douane malgache à partir de la valeur déclarée que vous indiquez. Vous restez informé de chaque étape via le suivi.",
  },
  {
    q: "Puis-je utiliser l'application sur mon téléphone ?",
    a: "Oui, l'application MadaColis (Android) est téléchargeable gratuitement depuis la page d'accueil : catalogue, suivi en temps réel et paiement mobile depuis votre téléphone.",
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [searchQuery, setSearchQuery] = useState("");

  const { data } = useQuery({
    queryKey: ["home-products"],
    queryFn: () => api<{ products: AmazonProduct[] }>("/pricing/marketplace/products?limit=8&skip=0"),
  });

  const featured = (data?.products ?? []).filter((p) => p.priceEUR != null).slice(0, 4).map(toCatalogProduct);
  const newcomers = (data?.products ?? []).filter((p) => p.priceEUR != null).slice(4, 8).map(toCatalogProduct);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(searchQuery.trim() ? `/catalogue?q=${encodeURIComponent(searchQuery.trim())}` : "/catalogue");
  };

  return (
    <>
      {/* En-tête */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40 dark:bg-grid-light" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.07),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.12),transparent_55%)]" />
        <div className="container-page relative grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-20">
          <div className="space-y-6">
            <Reveal variant="fade">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                <Store className="size-3.5" />
                {t("hero.badge")}
              </span>
            </Reveal>
            <Reveal variant="fade" delay={40}>
              <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-[2.75rem]">
                {t("hero.titleStart")} <span className="gradient-text">{t("hero.titleEnd")}</span>
              </h1>
            </Reveal>
            <Reveal variant="fade" delay={80}>
              <p className="max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300">{t("hero.subtitle")}</p>
            </Reveal>

            <Reveal variant="fade" delay={120}>
              <form onSubmit={submitSearch} className="relative max-w-lg">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("hero.placeholder")}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-28 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:pr-32"
                />
                <Button type="submit" size="md" className="absolute right-1.5 top-1/2 -translate-y-1/2">
                  <Search className="size-4" /> {t("common.search")}
                </Button>
              </form>
            </Reveal>

            <Reveal variant="fade" delay={160}>
              <div className="flex flex-wrap gap-3">
                <Link to="/catalogue">
                  <Button size="lg" variant="primary" className="btn-shine">
                    <ShoppingBag className="size-4" />
                    {t("hero.ctaCatalog")}
                  </Button>
                </Link>
                <Link to="/suivi">
                  <Button size="lg" variant="outline">
                    <SearchCheck className="size-4" />
                    {t("common.track")}
                  </Button>
                </Link>
              </div>
            </Reveal>

            <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-sm text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <BadgeCheck className="size-4 text-blue-600 dark:text-blue-400" /> {t("hero.bullet1")}
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="size-4 text-blue-600 dark:text-blue-400" /> {t("hero.bullet2")}
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="size-4 text-blue-600 dark:text-blue-400" /> {t("hero.bullet3")}
              </li>
            </ul>
          </div>

          <Reveal variant="up" delay={120} className="hidden lg:block">
            <div className="animate-float-slow mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-blue-900/5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold tracking-wide text-blue-700 dark:text-blue-300">MD-FR-2026-000001</span>
                <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <Package className="size-4" />
                </span>
              </div>
              <p className="mt-6 text-xs uppercase tracking-widest text-slate-400">{t("hero.cardStatus")} · Express</p>
              <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                <span>{t("hero.cardOrigin")}</span>
                <Plane className="size-4 text-blue-600 dark:text-blue-400" />
                <span>{t("hero.cardDest")}</span>
              </div>
              <div className="mt-6 space-y-2.5">
                {["cardSteps.0", "cardSteps.1", "cardSteps.2", "cardSteps.3"].map((key, i) => (
                  <div key={key} className={`flex items-center gap-2.5 text-sm ${i === 0 ? "font-semibold text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}>
                    <span className={`size-2 shrink-0 rounded-full ${i === 0 ? "bg-blue-600 dark:bg-blue-400" : "bg-slate-300 dark:bg-slate-700"}`} />
                    {t(`hero.${key}`)}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Raccourcis */}
      <section className="container-page -mt-8 relative z-10 hidden lg:block">
        <div className="grid gap-4 md:grid-cols-3">
          {QUICK_LINKS.map((item, i) => (
            <Reveal key={item.to} delay={i * 70} variant="up">
              <Link
                to={item.to}
                className="card-lift flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <item.icon className="size-5" />
                </span>
                <span>
                  <span className="flex items-center gap-1 font-semibold text-slate-900 dark:text-white">
                    {item.label} <ArrowRight className="size-3.5 text-blue-600" />
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{item.text}</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="container-page py-14 lg:py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t("steps.title")}</h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">{t("steps.subtitle")}</p>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 80} className="card-hover rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <step.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{t(`steps.${i + 1}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{t(`steps.${i + 1}.desc`)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Nos services */}
      <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="container-page py-14 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t("services.title")}</h2>
              <p className="mt-3 text-slate-500 dark:text-slate-400">{t("services.subtitle")}</p>
            </div>
            <Link to="/services" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
              {t("services.viewDetails")} <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {SERVICES.map((s, i) => (
              <Reveal key={s} delay={i * 90} className="card-hover rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex size-11 items-center justify-center rounded-xl bg-brand-900 text-blue-400">
                  <Plane className="size-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold capitalize text-slate-900 dark:text-white">
                  Service {SERVICE_DESCRIPTIONS[s].split(".")[0].toLowerCase()}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{SERVICE_DESCRIPTIONS[s]}</p>
                <Link to="/tarifs" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  {t("common.seePricing")} <ArrowRight className="size-4" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Bandeau lien produit */}
      <section className="container-page py-14 lg:py-20">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-blue-200 bg-blue-50/60 p-7 dark:border-blue-900 dark:bg-blue-950/40 sm:flex-row sm:items-center">
            <div className="max-w-2xl">
              <h2 className="flex items-center gap-2.5 text-xl font-bold text-slate-900 dark:text-white">
                <PackagePlus className="size-5 text-blue-600 dark:text-blue-400" /> {t("orderBand.title")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t("orderBand.text")}</p>
            </div>
            <Link to="/dashboard/shipments/create" className="shrink-0">
              <Button size="lg" variant="primary" className="btn-shine">
                {t("common.order")} <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Produits à la une */}
      <section id="produits" className="container-page pb-14 lg:pb-20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t("featured.title")}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("featured.subtitle")}</p>
          </div>
          <Link to="/catalogue" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
            {t("common.viewAll")} <ArrowRight className="size-4" />
          </Link>
        </div>
        <Reveal>
          <ProductGrid products={featured} className="mt-6" />
        </Reveal>
      </section>

      {/* Nouveautés */}
      <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="container-page py-14 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t("newcomers.title")}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("newcomers.subtitle")}</p>
            </div>
            <Link to="/catalogue" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
              {t("common.discover")} <ArrowRight className="size-4" />
            </Link>
          </div>
          <Reveal>
            <ProductGrid products={newcomers} className="mt-6" />
          </Reveal>
        </div>
      </section>

      {/* Calculateur de prix */}
      <section id="calculateur" className="container-page py-14 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t("calculator.title")}</h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">{t("calculator.subtitle")}</p>
        </div>
        <div className="mt-10">
          <CostCalculator />
        </div>
      </section>

      {/* Avantages */}
      <section className="border-y border-slate-200 bg-slate-50 py-14 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t("why.title")}</h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">{t("why.subtitle")}</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ADVANTAGES.map((item, i) => (
              <Reveal key={item.title} delay={i * 70} className="card-hover flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <item.icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Application mobile */}
      <section id="app" className="container-page py-14 lg:py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-7 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 sm:p-10">
            <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-900/30" />
            <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                  <Smartphone className="size-3.5" />
                  {t("download.badge")} · {t("download.platform")}
                </span>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{t("download.title")}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t("download.subtitle")}</p>
                <ul className="mt-5 space-y-2.5">
                  {[t("download.feature1"), t("download.feature2"), t("download.feature3")].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                      <BadgeCheck className="size-4 shrink-0 text-blue-600 dark:text-blue-400" /> {f}
                    </li>
                  ))}
                </ul>
                <a href="/apk/madacolis.apk" download className="mt-6 inline-block">
                  <Button size="lg" variant="primary" className="btn-shine">
                    <Smartphone className="size-4" />
                    {t("download.button")}
                  </Button>
                </a>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{t("download.note")}</p>
              </div>

              <div className="mx-auto hidden shrink-0 items-center gap-4 lg:flex">
                <div className="animate-float-slow flex size-40 items-center justify-center rounded-[2.5rem] border border-blue-200 bg-white p-6 shadow-xl shadow-blue-900/10 dark:border-blue-800 dark:bg-slate-900">
                  <Smartphone className="size-full text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section id="faq" className="container-page py-14 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{t("faq.title")}</h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">{t("faq.subtitle")}</p>
          </div>
          <div className="mt-8 space-y-3">
            {FAQS.map((faq, i) => (
              <Reveal key={faq.q} delay={i * 60} variant="up">
                <details className="group rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-slate-900 dark:text-white">
                    {faq.q}
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-open:rotate-45 dark:bg-slate-800 dark:text-slate-300">
                      <Plus className="size-4" />
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{faq.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Contacts WhatsApp */}
      <section className="container-page pb-16 lg:pb-20">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
            <div className="max-w-xl">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t("whatsapp.title")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{t("whatsapp.text")}</p>
            </div>
            <a href={whatsappLink()} target="_blank" rel="noreferrer">
              <Button size="lg" variant="primary" className="btn-shine">
                <MessageCircle className="size-5" />
                {t("whatsapp.cta")}
              </Button>
            </a>
          </div>
        </Reveal>
      </section>
    </>
  );
}