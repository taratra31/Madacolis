import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageCircle, Phone } from "lucide-react";
import { AuthShell } from "@/pages/auth/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { whatsappLink } from "@/utils";

const schema = z.object({
  phone: z.string().trim().min(8, "Téléphone invalide").max(30).or(z.literal("")).refine((v) => v.length > 0, "Indiquez un téléphone"),
  email: z.string().trim().email("Email invalide").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) => {
    const text = `Bonjour MadaColis,\n\nJe n'arrive pas à réinitialiser mon mot de passe.\n\nTéléphone : ${values.phone}${values.email ? `\nEmail : ${values.email}` : ""}\n\nMerci de m'aider.`;
    window.open(whatsappLink(text), "_blank", "noopener");
    setSent(true);
  });

  return (
    <AuthShell
      mode="login"
      footer={
        <>
          <Link to="/login" className="font-semibold text-blue-200 hover:text-blue-100">
            ← Retour à la connexion
          </Link>
        </>
      }
    >
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mot de passe oublié</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          La réinitialisation se fait avec l'aide de notre support WhatsApp (sécurité renforcée).
        </p>
      </div>
      {sent ? (
        <div className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center dark:border-blue-900 dark:bg-blue-950/40">
          <MessageCircle className="mx-auto size-8 text-blue-600 dark:text-blue-400" />
          <p className="font-semibold text-slate-900 dark:text-white">WhatsApp ouvert !</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Envoyez le message pré-rempli : notre équipe vérifiera votre identité et vous renverra vers la procédure de réinitialisation.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Input
            label="Téléphone du compte"
            placeholder="+261 32 63 21 784"
            icon={<Phone className="size-4" />}
            error={errors.phone?.message}
            {...register("phone")}
          />
          <Input label="Email (optionnel)" type="email" placeholder="vous@exemple.com" error={errors.email?.message} {...register("email")} />
          <Button type="submit" fullWidth size="lg" variant="primary">
            <MessageCircle className="size-4" />
            Demander l'aide du support
          </Button>
          <p className="text-center text-xs text-slate-400">
            Vous recevrez un accompagnement personnalisé sur WhatsApp pour restaurer l'accès à votre compte.
          </p>
        </form>
      )}
    </AuthShell>
  );
}