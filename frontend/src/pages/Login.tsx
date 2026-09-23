import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ApiClientError } from "../lib/api";

const FEATURES = [
  { icon: "M4 6h16v12H4z", title: "Supervision complète", desc: "Dashboard, utilisateurs, colis, paiements et audit en temps réel." },
  { icon: "M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z", title: "Contrôle granulaire", desc: "Statuts des colis, rôles et permissions par niveau d'accès." },
  { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.6a2 2 0 011.4.6l1.4 1.4a2 2 0 001.2.6H19a2 2 0 012 2v12a2 2 0 01-2 2z", title: "Journal d'audit", desc: "Chaque action sensible est tracée et consultable." },
];

export default function Login() {
  const { token, user, login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (token && user) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#0b1220] text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-24 h-96 w-96 rounded-full bg-emerald-700/20 blur-3xl" />
        <div className="relative flex items-center gap-3 p-12">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg shadow-emerald-500/30">
            <img src="/logo.png" alt="MadaColis" className="h-full w-full object-cover" />
          </div>
          <div className="text-sm font-bold">MadaColis</div>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-white/10 ring-inset">
            Administration
          </span>
        </div>

        <div className="relative px-12 pb-16">
          <h1 className="max-w-md text-4xl font-bold leading-tight">
            Pilotez vos opérations, <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">en toute sérénité</span>.
          </h1>
          <p className="mt-3 max-w-md text-sm text-slate-400">
            La plateforme de livraison de colis entre Madagascar et la France.
          </p>
          <div className="mt-10 space-y-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex max-w-md items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20 ring-inset">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d={f.icon} />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold">{f.title}</div>
                  <div className="text-sm text-slate-400">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative px-12 pb-8 text-xs text-slate-500">© {new Date().getFullYear()} MadaColis — Madagascar ↔ France</div>
      </div>

      <div className="flex items-center justify-center bg-[#f3f5f9] p-6">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-emerald-500/30">
              <img src="/logo.png" alt="MadaColis" className="h-full w-full object-cover" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Connexion</h2>
          <p className="mt-1 text-sm text-slate-500">Accédez à la console d'administration.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email ou téléphone</label>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="input"
                placeholder="admin@madacolis.mg"
                autoComplete="username"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="animate-fade-in rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary h-11 w-full text-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Connexion…
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Accès réservé au personnel autorisé.
          </p>
        </div>
      </div>
    </div>
  );
}