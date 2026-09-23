import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-black text-brand-200 dark:text-brand-900/60">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Page introuvable</h1>
      <p className="mt-2 max-w-md text-slate-500 dark:text-slate-400">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Link to="/" className="mt-6">
        <Button size="lg">Retour à l'accueil</Button>
      </Link>
    </section>
  );
}