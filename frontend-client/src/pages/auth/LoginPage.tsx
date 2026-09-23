import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { AuthShell } from "@/pages/auth/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/auth";
import { ApiError } from "@/services/api";

const schema = z.object({
  identifier: z.string().trim().min(1, "Email ou téléphone requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const [showPwd, setShowPwd] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setFormError("");
    try {
      await login(values.identifier, values.password, remember);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? "/dashboard", { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Impossible de se connecter");
    } finally {
      setLoading(false);
    }
  });

  return (
    <AuthShell mode="login">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Email ou téléphone"
          placeholder="vous@exemple.com ou +261…"
          icon={<Mail className="size-4" />}
          autoComplete="username"
          error={errors.identifier?.message}
          {...register("identifier")}
        />
        <div>
          <Input
            label="Mot de passe"
            type={showPwd ? "text" : "password"}
            placeholder="••••••••"
            icon={<Lock className="size-4" />}
            autoComplete="current-password"
            error={errors.password?.message}
            suffix={
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
            {...register("password")}
          />
          <div className="mt-2 flex items-center justify-between">
            <label
              className="flex cursor-pointer items-center gap-2 select-none"
              onClick={(e) => {
                e.preventDefault();
                setRemember((r) => !r);
              }}
            >
              <span
                role="checkbox"
                aria-checked={remember}
                aria-label="Se souvenir de moi"
                className={`flex size-5 items-center justify-center rounded-md border-2 border-blue-600 transition ${remember ? "bg-blue-600" : "bg-white dark:bg-slate-900"}`}
              >
                {remember && <Check className="size-3.5 text-white" />}
              </span>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Se souvenir de moi</span>
            </label>
            <Link
              to="/mot-de-passe-oublie"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        </div>

        {formError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">{formError}</p>}

        <Button
          type="submit"
          fullWidth
          loading={loading}
          size="lg"
          className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-lg shadow-blue-600/40"
        >
          Se connecter
        </Button>
      </form>
    </AuthShell>
  );
}