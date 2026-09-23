import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, ChevronUp, KeyRound, Mail, MapPin, Phone, User } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/auth";
import { api, ApiError } from "@/services/api";

function AccordionCard({
  icon: Icon,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  icon: typeof User;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="cursor-pointer select-none" role="button" tabIndex={0} onClick={onToggle} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}>
        <span className="flex flex-1 items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <span className="flex size-7 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <Icon className="size-4" />
          </span>
          <span className="flex flex-col items-start">
            <span>{title}</span>
            <span className="text-[11px] font-normal text-slate-400">{subtitle}</span>
          </span>
        </span>
        {open ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
      </CardHeader>
      {open ? <CardBody>{children}</CardBody> : null}
    </Card>
  );
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z.string().min(8, "Minimum 8 caractères"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, { message: "Les mots de passe ne correspondent pas", path: ["confirmPassword"] });

export function ProfilePage() {
  const { user } = useAuth();
  const [openInfo, setOpenInfo] = useState(false);
  const [openPwd, setOpenPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const pwdForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmitPassword = pwdForm.handleSubmit(async (values) => {
    setPwdMsg(null);
    try {
      await api("/auth/password", {
        method: "PUT",
        body: { currentPassword: values.currentPassword, newPassword: values.newPassword },
      });
      setPwdMsg({ ok: true, text: "Mot de passe modifié." });
      pwdForm.reset();
    } catch (err) {
      setPwdMsg({ ok: false, text: err instanceof ApiError ? err.message : "Erreur lors du changement de mot de passe." });
    }
  });

  if (!user) return null;

  const rows: Array<{ icon: typeof User; label: string; value?: string | null }> = [
    { icon: User, label: "Nom complet", value: user.name },
    { icon: Mail, label: "Email", value: user.email ?? "—" },
    { icon: Phone, label: "Téléphone", value: user.phone },
    { icon: MapPin, label: "Ville", value: user.city },
    { icon: MapPin, label: "Pays", value: user.country },
    { icon: MapPin, label: "Adresse", value: user.address },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mon profil</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Vos informations personnelles et votre sécurité.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AccordionCard icon={User} title="Informations personnelles" subtitle="Vos données MadaColis" open={openInfo} onToggle={() => setOpenInfo((v) => !v)}>
          <ul className="grid gap-3">
            {rows.map((row) => (
              <li key={row.label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <row.icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{row.label}</p>
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{row.value || "—"}</p>
                </div>
              </li>
            ))}
          </ul>
        </AccordionCard>

        <AccordionCard icon={KeyRound} title="Changer le mot de passe" subtitle="Sécurisez votre compte" open={openPwd} onToggle={() => setOpenPwd((v) => !v)}>
          <form onSubmit={onSubmitPassword} className="grid gap-4" noValidate>
            <Input label="Mot de passe actuel" type="password" error={pwdForm.formState.errors.currentPassword?.message} {...pwdForm.register("currentPassword")} />
            <Input label="Nouveau mot de passe" type="password" error={pwdForm.formState.errors.newPassword?.message} {...pwdForm.register("newPassword")} />
            <Input label="Confirmer le nouveau mot de passe" type="password" error={pwdForm.formState.errors.confirmPassword?.message} {...pwdForm.register("confirmPassword")} />
            {pwdMsg && (
              <p className={`rounded-xl px-4 py-3 text-sm font-medium ${pwdMsg.ok ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"}`}>
                {pwdMsg.text}
              </p>
            )}
            <Button type="submit" loading={pwdForm.formState.isSubmitting}>
              Changer le mot de passe
            </Button>
          </form>
        </AccordionCard>
      </div>
    </div>
  );
}