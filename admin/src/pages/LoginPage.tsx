import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { login } from "../api/endpoints";
import { inputCls } from "../components/ui";

export default function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(identifier.trim(), password);
      if (res.token) {
        localStorage.setItem("admin_token", res.token);
        localStorage.setItem("admin_user", JSON.stringify(res.user));
      }
      void navigate("/", { replace: true });
    } catch (err) {
      const msg = axiosErr(err);
      setError(msg);
      if (msg.toLowerCase().includes("admin") || msg.toLowerCase().includes("autoris")) {
        setError("Accès refusé : compte non administrateur.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] p-4">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#020617_0%,#0F172A_30%,#1E3A8A_65%,#2563EB_100%)]" />
      <div className="pointer-events-none absolute -right-16 -top-24 size-64 animate-blob rounded-full bg-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 top-1/3 size-52 animate-blob rounded-full bg-purple-500/15 blur-3xl" style={{ animationDelay: "-6s" }} />
      <div className="pointer-events-none absolute -bottom-28 -right-10 size-72 animate-blob rounded-full bg-blue-600/25 blur-3xl" style={{ animationDelay: "-3s" }} />
      <div className="pointer-events-none absolute left-1/2 top-1/4 size-80 -translate-x-1/2 animate-pulse-soft rounded-full bg-white/5 blur-2xl" />

      <div className="relative flex w-full max-w-md flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="rounded-[26px] bg-white/15 p-1 shadow-[0_8px_22px_rgba(59,130,246,0.6)]">
            <div className="flex size-16 items-center justify-center overflow-hidden rounded-[20px] bg-white shadow-lg shadow-blue-900/40 sm:size-[72px]">
              <img src="/logo.png" alt="MadaColis" className="size-full object-cover" />
            </div>
          </div>
          <h1 className="mt-1 text-[32px] font-black tracking-wide text-white">MadaColis</h1>
          <p className="text-sm text-blue-200">Espace administrateur</p>
        </div>

        <div className="w-full rounded-3xl bg-white/95 p-5 shadow-[0_18px_32px_rgba(0,0,0,0.45)] sm:p-6">
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">E-mail ou téléphone</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-slate-400" />
                <input className={`${inputCls} pl-10`} value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="admin@madacolis.mg" autoFocus />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Mot de passe</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-slate-400" />
                <input type={showPwd ? "text" : "password"} className={`${inputCls} py-2.5 pl-10 pr-10`} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute inset-y-0 right-2 my-auto flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p> : null}
            <button
              disabled={loading || !identifier.trim() || !password}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 py-3 font-semibold text-white shadow-lg shadow-blue-600/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function axiosErr(err: unknown): string {
  if (typeof err === "object" && err != null) {
    const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
    return e.response?.data?.message ?? e.response?.data?.error ?? e.message ?? "Erreur inconnue";
  }
  return String(err);
}