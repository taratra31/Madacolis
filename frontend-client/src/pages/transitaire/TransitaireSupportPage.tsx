import { Clock, Headphones, Mail, MessageCircle, Phone } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { WHATSAPP_NUMBER, whatsappLink } from "@/utils";

const FAQ = [
  {
    q: "Comment suivre un colis en temps réel ?",
    a: "La page « Suivi en direct » affiche l'avancement de toutes les expéditions en cours, avec la dernière étape enregistrée.",
  },
  {
    q: "Comment modifier le statut d'une expédition ?",
    a: "Ouvrez le colis depuis « Colis », puis mettez à jour son statut (Reçu, En transit, En douane, En cours de livraison, Livré, Annulé).",
  },
  {
    q: "Quand les commissions sont-elles versées ?",
    a: "Le récapitulatif des paiements et des commissions est disponible dans « Facturation ».",
  },
];

export function TransitaireSupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Support</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Besoin d'aide ? Contactez notre équipe ou consultez la FAQ.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody className="flex flex-col items-center gap-2 p-5 text-center">
            <MessageCircle className="size-8 text-emerald-500" />
            <p className="font-semibold text-slate-900 dark:text-white">WhatsApp</p>
            <p className="text-xs text-slate-500">{WHATSAPP_NUMBER}</p>
            <a
              href={whatsappLink("Bonjour MadaColis (Espace transitaire), je souhaite contacter le support.")}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Discuter
            </a>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex flex-col items-center gap-2 p-5 text-center">
            <Mail className="size-8 text-indigo-500" />
            <p className="font-semibold text-slate-900 dark:text-white">Email</p>
            <p className="text-xs text-slate-500">support@madacolis.mg</p>
            <a href="mailto:support@madacolis.mg" className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Envoyer
          </a>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex flex-col items-center gap-2 p-5 text-center">
            <Phone className="size-8 text-blue-500" />
            <p className="font-semibold text-slate-900 dark:text-white">Téléphone</p>
            <p className="text-xs text-slate-500">+261 34 12 345 67</p>
            <a href="tel:+261341234567" className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Appeler
          </a>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex flex-col items-center gap-2 p-5 text-center">
            <Clock className="size-8 text-amber-500" />
            <p className="font-semibold text-slate-900 dark:text-white">Horaires</p>
            <p className="text-xs text-slate-500">Lun – Ven · 8h à 18h</p>
            <p className="text-xs text-slate-500">Sam · 9h à 13h</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Headphones className="size-4 text-indigo-500" /> Questions fréquentes
          </h2>
        </CardHeader>
        <CardBody className="space-y-4">
          {FAQ.map((f) => (
            <div key={f.q} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
              <p className="font-semibold text-slate-900 dark:text-white">{f.q}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{f.a}</p>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}