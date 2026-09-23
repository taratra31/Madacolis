import { useEffect, useState } from "react";
import { Save, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";

const KEY = "mc_transitaire_settings";

type Settings = {
  displayCurrency: string;
  refreshInterval: number;
  notifications: boolean;
  compactMode: boolean;
};

const DEFAULTS: Settings = {
  displayCurrency: "Ar",
  refreshInterval: 30,
  notifications: true,
  compactMode: false,
};

function load(): Settings {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Settings>) };
  } catch {
    return DEFAULTS;
  }
}

export function TransitaireSettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(load());
  }, []);

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setSettings((s) => ({ ...s, [k]: v }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          <Settings2 className="mr-2 inline size-6 text-indigo-600 dark:text-indigo-400" />
          Paramètres
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Préférences de l'espace transitaire (enregistrées sur cet appareil).</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Affichage</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Devise par défaut"
              options={[
                { value: "Ar", label: "Ariary (Ar)" },
                { value: "EUR", label: "Euro (EUR)" },
                { value: "Auto", label: "Selon le colis" },
              ]}
              value={settings.displayCurrency}
              onChange={(e) => set("displayCurrency", e.target.value)}
            />
            <Select
              label="Actualisation automatique"
              options={[
                { value: "15", label: "Toutes les 15 s" },
                { value: "30", label: "Toutes les 30 s" },
                { value: "60", label: "Toutes les minutes" },
                { value: "0", label: "Désactivée" },
              ]}
              value={String(settings.refreshInterval)}
              onChange={(e) => set("refreshInterval", Number(e.target.value))}
            />
          </div>
          <Checkbox label="Afficher le mode compact (tableaux plus denses)" checked={settings.compactMode} onChange={(e) => set("compactMode", e.target.checked)} />
          <Checkbox label="Recevoir des notifications d'activité" checked={settings.notifications} onChange={(e) => set("notifications", e.target.checked)} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Coordonnées de l'agence</h2>
        </CardHeader>
        <CardBody>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Ces informations sont utilisées sur vos bons d'envoi et rapports.</p>
          <Input label="Nom de l'agence" defaultValue="MadaColis" />
        </CardBody>
      </Card>

      <Button size="lg" onClick={save}>
        <Save className="size-4" /> {saved ? "Paramètres enregistrés" : "Enregistrer"}
      </Button>
    </div>
  );
}