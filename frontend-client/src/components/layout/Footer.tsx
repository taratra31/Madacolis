import { Link } from "react-router-dom";
import { Facebook, Instagram, MessageCircle, Send, Twitter } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useLocale } from "@/contexts/locale";
import { whatsappLink } from "@/utils";

const FOOTER_LINKS = [
  {
    title: "footer.nav",
    links: [
      { label: "nav.home", to: "/" },
      { label: "nav.services", to: "/services" },
      { label: "nav.pricing", to: "/tarifs" },
      { label: "nav.track", to: "/suivi" },
    ],
  },
  {
    title: "footer.company",
    links: [
      { label: "footer.about", to: "/a-propos" },
      { label: "footer.contact", to: "/contact" },
      { label: "footer.faq", to: "/#faq" },
    ],
  },
  {
    title: "footer.client",
    links: [
      { label: "nav.login", to: "/login" },
      { label: "nav.signup", to: "/register" },
      { label: "nav.dashboard", to: "/dashboard" },
    ],
  },
];

export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="border-t border-slate-700 bg-brand-950 text-slate-300">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo className="[&_span:last-child]:text-white" />
          <p className="max-w-xs text-sm leading-relaxed text-slate-400">{t("footer.tagline")}</p>
          <div className="flex items-center gap-3">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
            <LanguageSwitcher />
          </div>
        </div>

        {FOOTER_LINKS.map((col) => (
          <div key={col.title}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">{t(col.title)}</h3>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-slate-400 transition hover:text-blue-400">
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-5 sm:flex-row">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} MadaColis. {t("footer.rights")}</p>
          <div className="flex items-center gap-3">
            <a href="#" aria-label="Facebook" className="rounded-lg p-1.5 text-slate-400 transition hover:text-white">
              <Facebook className="size-4" />
            </a>
            <a href="#" aria-label="Instagram" className="rounded-lg p-1.5 text-slate-400 transition hover:text-white">
              <Instagram className="size-4" />
            </a>
            <a href="#" aria-label="Twitter" className="rounded-lg p-1.5 text-slate-400 transition hover:text-white">
              <Twitter className="size-4" />
            </a>
            <a href="#" aria-label="Télégramme" className="rounded-lg p-1.5 text-slate-400 transition hover:text-white">
              <Send className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}