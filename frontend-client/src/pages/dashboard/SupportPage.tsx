import { Link } from "react-router-dom";
import { Clock, FileQuestion, HelpCircle, MessageCircle, Package, Scale } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { whatsappLink } from "@/utils";

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Comment suivre mon colis ?",
    a: "Utilisez la page « Suivi » avec votre numéro de tracking (MD-FR-…), ou consultez « Mes colis » depuis votre espace client.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "MVola, Orange Money, Airtel Money, carte bancaire et espèces en agence. Vous recevez une référence à communiquer à notre équipe pour valider.",
  },
  {
    q: "Quels documents sont nécessaires ?",
    a: "Une pièce d'identité suffit pour la plupart des colis. Selon le contenu, une facture ou un formulaire douanier peut être demandé.",
  },
  {
    q: "Que faire si mon colis est endommagé ?",
    a: "Signalez-le dès réception avec photos. Notre responsable litiges vous répond via WhatsApp sous 48h.",
  },
];

export function SupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Aide et support</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Réponses aux questions fréquentes et assistance directe.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <div className="flex items-center gap-4">
          <MessageCircle className="size-8" />
          <div>
            <h2 className="text-lg font-bold">Parler à un conseiller</h2>
            <p className="text-sm text-blue-100">Réponse en quelques minutes, 7j/7.</p>
          </div>
        </div>
        <a href={whatsappLink()} target="_blank" rel="noreferrer">
          <Button variant="dark">Ouvrir WhatsApp</Button>
        </a>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <HelpCircle className="size-4 text-blue-600 dark:text-blue-400" /> Questions fréquentes
            </h2>
            <div className="mt-4 space-y-3">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group rounded-xl border border-slate-200 p-4 open:border-blue-300 dark:border-slate-800 open:dark:border-blue-800">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {faq.q}
                    <span className="text-blue-600 transition group-open:rotate-180 dark:text-blue-400">▾</span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{faq.a}</p>
                </details>
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-3 text-sm">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Clock className="size-4 text-blue-600 dark:text-blue-400" /> Horaires d'assistance
              </h2>
              <p className="text-slate-500">Lun – Sam : 8h00 – 17h00 (heure de Madagascar)</p>
              <p className="text-slate-500">WhatsApp : 7j/7, 8h – 20h</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-3 text-sm">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <Scale className="size-4 text-blue-600 dark:text-blue-400" /> Litiges et réclamations
              </h2>
              <p className="text-slate-500">Déclarez tout litige (colis endommagé, perdu, retard) avec photos dans les 48h suivant la réception.</p>
              <a href={whatsappLink()} target="_blank" rel="noreferrer" className="inline-block w-full">
                <Button variant="outline" fullWidth>
                  Déclarer un litige
                </Button>
              </a>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-3 text-sm">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                <FileQuestion className="size-4 text-blue-600 dark:text-blue-400" /> Besoin d'aide pour un envoi ?
              </h2>
              <p className="text-slate-500">Notre guide pas à pas vous aide à créer votre premier colis.</p>
              <Link to="/#comment" className="inline-block w-full">
                <Button variant="secondary" fullWidth>
                  <Package className="size-4" /> Voir le guide
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}