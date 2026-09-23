import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, MapPin, Phone, User } from "lucide-react";
import { AuthShell } from "@/pages/auth/AuthShell";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/auth";
import { ApiError } from "@/services/api";

const schema = z
  .object({
    name: z.string().trim().min(2, "Nom complet requis"),
    email: z.string().trim().email("Email invalide").optional().or(z.literal("")),
    phone: z.string().trim().min(8, "Téléphone invalide (minimum 8 caractères)").max(30),
    password: z.string().min(8, "Minimum 8 caractères"),
    confirmPassword: z.string(),
    country: z.string().min(1),
    city: z.string().optional(),
  })
  .refine((v) => v.password === v.confirmPassword, { message: "Les mots de passe ne correspondent pas", path: ["confirmPassword"] });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { country: "Madagascar", city: "Antananarivo" },
  });

  const country = watch("country");

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setFormError("");
    try {
      await registerUser({
        name: values.name,
        email: values.email || undefined,
        phone: values.phone,
        password: values.password,
        country: values.country,
        city: values.city,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Impossible de créer le compte");
    } finally {
      setLoading(false);
    }
  });

  return (
    <AuthShell mode="register">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input label="Nom complet" placeholder="Jean Rakoto" icon={<User className="size-4" />} autoComplete="name" error={errors.name?.message} {...register("name")} />
        <Input label="Email (optionnel)" type="email" placeholder="vous@exemple.com" icon={<Mail className="size-4" />} error={errors.email?.message} {...register("email")} />
        <Input label="Téléphone" placeholder="+261 34 12 345 67" icon={<Phone className="size-4" />} autoComplete="tel" error={errors.phone?.message} {...register("phone")} />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Pays"
            options={[
              { value: "Madagascar", label: "Madagascar" },
              { value: "France", label: "France" },
            ]}
            error={errors.country?.message}
            {...register("country")}
          />
          <Input label="Ville" placeholder={country === "Madagascar" ? "Antananarivo" : "Paris"} icon={<MapPin className="size-4" />} error={errors.city?.message} {...register("city")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Mot de passe"
            type={showPwd ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
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
          <Input label="Confirmation" type={showPwd ? "text" : "password"} placeholder="••••••••" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        </div>

        {formError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">{formError}</p>}

        <Button type="submit" fullWidth size="lg" loading={loading} className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-lg shadow-blue-600/40">
          Créer mon compte
        </Button>
        <p className="text-center text-xs text-slate-400">
          En créant un compte, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
        </p>
      </form>
    </AuthShell>
  );
}