import { Link } from "react-router-dom";
import { Eye, Landmark, MapPinned, PackageSearch, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { useLocale } from "@/contexts/locale";

const VALUES = [
  {
    icon: MapPinned,
    title: "Notre mission",
    text: "Relier Madagascar et la France par un service de transport de colis fiable, transparent et simple à utiliser depuis un téléphone.",
  },
  {
    icon: Eye,
    title: "Transparence",
    text: "Un prix estimé en ligne, un numéro de tracking unique et un historique détaillé pour chaque colis.",
  },
  {
    icon: ShieldCheck,
    title: "Confiance",
    text: "Une manutention soignée, des colis protégés et une équipe disponible 7 jours sur 7 pour vous accompagner.",
  },
  {
    icon: Landmark,
    title: "Enracinement local",
    text: "Une présence des deux côtés : agences et partenaires à Madagascar comme en France, pour un service porte-à-porte.",
  },
];

export function AboutPage() {
  const { t } = useLocale();
  return (
    <>
      <PageHeader title={t("pages.about.title")} description={t("pages.about.subtitle")} />

      <section className="container-page py-14">
        <Reveal variant="fade" className="mx-auto max-w-3xl text-center">
          <p className="leading-relaxed text-slate-600 dark:text-slate-300">
            Fondée pour répondre aux besoins des particuliers et des entreprises, MadaColis propose une expérience
            d'expédition 100 % en ligne : estimation du prix en quelques secondes, création d'envoi en plusieurs étapes,
            paiement mobile et suivi en temps réel du dépôt jusqu'à la livraison.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {VALUES.map((value, i) => (
            <Reveal key={value.title} delay={i * 80} variant={i % 2 === 0 ? "up" : "left"} className="card-lift rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex size-11 animate-float items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400" style={{ animationDelay: `${i * 0.4}s` }}>
                <value.icon className="size-5" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{value.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{value.text}</p>
            </Reveal>
          ))}
        </div>

        <Reveal variant="zoom" delay={120} className="mt-14 flex flex-col items-center gap-4 rounded-2xl bg-brand-950 p-8 text-center text-white">
          <PackageSearch className="size-8 animate-float text-blue-400" />
          <h2 className="text-2xl font-bold">Prêt à envoyer votre premier colis ?</h2>
          <p className="max-w-xl text-sm text-slate-300">
            Créez un compte en deux minutes, estimez votre prix et suivez chaque étape de votre expédition.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button variant="primary" size="lg" className="btn-shine">
                Créer un compte
              </Button>
            </Link>
            <Link to="/suivi">
              <Button variant="outline" size="lg" className="border-white/25 bg-transparent text-white hover:bg-white/10">
                Suivre un colis
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}