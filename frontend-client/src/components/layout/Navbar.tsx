import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Menu, Monitor, Moon, PackagePlus, Search, ShoppingCart, Sun, X } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useAuth } from "@/contexts/auth";
import { useCart } from "@/contexts/cart";
import { useTheme } from "@/contexts/theme";
import { useLocale } from "@/contexts/locale";
import { cn } from "@/utils";

const NAV_LINKS = [
  { to: "/", label: "nav.home" },
  { to: "/catalogue", label: "nav.catalog" },
  { to: "/services", label: "nav.services" },
  { to: "/tarifs", label: "nav.pricing" },
  { to: "/suivi", label: "nav.track" },
];

export function PublicNavbar() {
  const { user } = useAuth();
  const { theme, cycleTheme } = useTheme();
  const { t } = useLocale();
  const { totalItems } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const spaceHref = user?.role === "TRANSITAIRE" ? "/espace-transitaire" : "/dashboard";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors",
        scrolled
          ? "border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90"
          : "border-transparent bg-white dark:bg-slate-950",
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" aria-label="MadaColis — accueil">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
                )
              }
            >
              {t(link.label)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            onClick={cycleTheme}
            className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label={theme === "system" ? t("nav.themeSystem") : theme === "dark" ? t("nav.themeDark") : t("nav.themeLight")}
            title={theme === "system" ? t("nav.themeTitleSystem") : theme === "dark" ? t("nav.themeTitleDark") : t("nav.themeTitleLight")}
          >
            {theme === "dark" ? <Sun className="size-5" /> : theme === "light" ? <Moon className="size-5" /> : <Monitor className="size-5" />}
            {theme === "system" && (
              <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-blue-400/50" />
            )}
          </button>

          <Link to="/panier" className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100" aria-label={t("nav.cart")}>
            <ShoppingCart className="size-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white animate-pop">{totalItems > 9 ? "9+" : totalItems}</span>
            )}
          </Link>

          {user ? (
            <Link to={spaceHref} className="hidden sm:block">
              <Button variant="primary" size="md">
                <LayoutDashboard className="size-4" />
                {t("nav.dashboard")}
              </Button>
            </Link>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login">
                <Button variant="outline" size="md">
                  {t("nav.login")}
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="md">
                  <PackagePlus className="size-4" />
                  {t("nav.signup")}
                </Button>
              </Link>
            </div>
          )}

          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            aria-label={t("nav.openMenu")}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 lg:hidden" aria-label="Menu mobile">
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "block rounded-xl px-3 py-2 text-sm font-semibold",
                      isActive ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                    )
                  }
                >
                  {t(link.label)}
                </NavLink>
              </li>
            ))}
            <li className="pt-2">
              {user ? (
                <Link to={spaceHref} className="block">
                  <Button variant="primary" fullWidth>
                    <LayoutDashboard className="size-4" /> {t("nav.dashboard")}
                  </Button>
                </Link>
              ) : (
                <div className="grid gap-2">
                  <Link to="/login">
                    <Button variant="outline" fullWidth>
                      {t("nav.login")}
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" fullWidth>
                      {t("nav.signup")}
                    </Button>
                  </Link>
                </div>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

export function TrackingBar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { t } = useLocale();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/suivi?code=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-xl items-center gap-2" aria-label="Suivre un colis">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400" size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("pages.tracking.placeholder")}
          className="h-12 w-full rounded-2xl border border-slate-300 bg-white pl-10 pr-3 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-700 dark:bg-slate-900"
        />
      </div>
      <Button type="submit" size="lg">
        {t("pages.tracking.submit")}
      </Button>
    </form>
  );
}