import { Link } from "react-router-dom";
import { ArrowRight, Boxes, PackageSearch, ShieldCheck, TrendingUp, Truck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { useLocale } from "@/contexts/locale";
import { SERVICE_DESCRIPTIONS, SERVICE_LABELS } from "@/utils";
import type { ServiceType } from "@/types";

const SERVICES: Array<{
  type: ServiceType;
  icon: typeof Truck;
  features: string[];
}> = [
  {
    type: "STANDARD",
    icon: Truck,
    features: ["Livraison en 7 à 10 jours", "Suivi en temps réel", "Idéal pour les envois réguliers"],
  },
  {
    type: "EXPRESS",
    icon: TrendingUp,
    features: ["Livraison en 3 à 5 jours", "Priorité de traitement", "Pour les colis urgents et valeurs"],
  },
  {
    type: "ECONOMY",
    icon: Boxes,
    features: ["Livraison en 12 à 16 jours", "Tarif le plus avantageux", "Parfait pour les colis lourds"],
  },
];

export function ServicesPage() {
  const { t } = useLocale();
  return (
    <>
      <PageHeader title={t("pages.services.title")} description={t("pages.services.subtitle")} />

      <section className="container-page py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {SERVICES.map((service, i) => (
            <Reveal key={service.type} delay={i * 100} variant={i === 1 ? "zoom" : i === 2 ? "left" : "right"} className="card-lift flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex size-12 animate-float items-center justify-center rounded-xl bg-brand-900 text-blue-400" style={{ animationDelay: `${i * 0.5}s` }}>
                <service.icon className="size-6" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{SERVICE_LABELS[service.type]}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{SERVICE_DESCRIPTIONS[service.type]}</p>
              <ul className="mt-4 space-y-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex-1" />
              <Link to="/tarifs">
                <Button variant="outline" fullWidth className="btn-shine">
                  Voir les tarifs <ArrowRight className="size-4" />
                </Button>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 overflow-hidden rounded-2xl bg-brand-950 py-3">
          <div className="flex w-max animate-marquee gap-8 whitespace-nowrap text-sm font-semibold uppercase tracking-widest text-blue-200">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex items-center gap-8" aria-hidden={dup === 1}>
                {["Madagascar ↔ France", "Suivi en temps réel", "Porte-à-porte", "Paiement MVola · Orange Money", "7j / 7"].map((tag) => (
                  <span key={tag} className="flex items-center gap-8">
                    {tag} <span className="text-blue-500">•</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {[
            { icon: PackageSearch, title: "Suivi à chaque étape", text: "Notification et position du colis du dépôt jusqu'à la livraison." },
            { icon: ShieldCheck, title: "Protection renforcée", text: "Manutention adaptée, emballage conseillé et prise en charge des fragiles." },
            { icon: TrendingUp, title: "Volume et franchises", text: "Des tarifs dégressifs pour les envois réguliers. Contactez-nous pour un devis." },
          ].map((item, i) => (
            <Reveal key={item.title} delay={i * 100} variant="up" className="card-lift rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/40">
              <item.icon className="size-6 animate-float text-blue-600 dark:text-blue-400" />
              <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{item.text}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}