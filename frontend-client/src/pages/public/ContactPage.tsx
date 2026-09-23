import { Clock, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { useLocale } from "@/contexts/locale";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { whatsappLink } from "@/utils";

const INFOS = [
  { icon: MapPin, title: "Adresse agence", lines: ["Lot II A 123, Antananarivo 101, Madagascar", "12 rue de Rivoli, 75004 Paris, France"] },
  { icon: Phone, title: "Téléphone", lines: ["+261 34 12 345 67 (Madagascar)", "+33 6 12 34 56 78 (France)"] },
  { icon: Clock, title: "Horaires", lines: ["Lun – Sam : 8h00 – 17h00", "WhatsApp : 7j/7"] },
  { icon: Mail, title: "Email", lines: ["support@madacolis.mg"] },
];

export function ContactPage() {
  const { t } = useLocale();
  return (
    <>
      <PageHeader title={t("pages.contact.title")} description={t("pages.contact.subtitle")} />

      <section className="container-page grid gap-8 py-14 lg:grid-cols-2">
        <div className="grid gap-4 sm:grid-cols-2">
          {INFOS.map((info, i) => (
            <Reveal key={info.title} delay={i * 70} variant={i % 2 === 0 ? "right" : "up"} className="card-lift rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex size-10 animate-float items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400" style={{ animationDelay: `${i * 0.4}s` }}>
                <info.icon className="size-5" />
              </div>
              <h2 className="mt-3 font-semibold text-slate-900 dark:text-white">{info.title}</h2>
              {info.lines.map((line) => (
                <p key={line} className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {line}
                </p>
              ))}
            </Reveal>
          ))}

          <Reveal delay={280} variant="zoom" className="card-lift">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noreferrer"
              className="btn-shine flex h-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white shadow-md"
            >
              <MessageCircle className="size-6 animate-float" />
              <h2 className="mt-3 font-semibold">WhatsApp direct</h2>
              <p className="mt-1 text-sm text-blue-100">Réponse en quelques minutes, 7j/7.</p>
            </a>
          </Reveal>
        </div>

        <Reveal variant="left" delay={120}>
          <Card className="card-lift h-full">
            <h2 className="flex items-center gap-2 px-5 pt-6 text-lg font-bold text-slate-900 dark:text-white sm:pt-8">
              <Send className="size-5 text-blue-600 dark:text-blue-400" />
              Envoyez-nous un message
            </h2>
            <form
              className="grid gap-4 p-5 sm:p-8"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data = new FormData(form);
                const text = `Bonjour MadaColis,\n\nNom : ${data.get("name")}\nEmail : ${data.get("email")}\nSujet : ${data.get("subject")}\n\nMessage :\n${data.get("message")}`;
                window.open(whatsappLink(text), "_blank", "noopener");
                form.reset();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Input name="name" label="Nom complet" placeholder="Jean Rakoto" required />
                <Input name="email" label="Email" type="email" placeholder="vous@exemple.com" required />
              </div>
              <Input name="subject" label="Sujet" placeholder="Demande de devis, suivi, douane…" />
              <Textarea name="message" label="Message" placeholder="Décrivez votre demande…" rows={5} required />
              <div className="flex flex-wrap gap-3">
                <Button type="submit" size="lg" className="btn-shine">
                  Envoyer via WhatsApp
                </Button>
                <p className="text-xs text-slate-400">Votre message ouvrira WhatsApp, pré-rempli à partir du formulaire.</p>
              </div>
            </form>
          </Card>
        </Reveal>
      </section>
    </>
  );
}