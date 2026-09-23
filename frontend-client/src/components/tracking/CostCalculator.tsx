import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Calculator, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PriceSummary } from "@/components/tracking/PriceSummary";
import { LocationPicker, RouteMap, type Location } from "@/components/ui/LocationPicker";
import { api } from "@/services/api";
import { CITIES_ARRIVEE, CITIES_DEPART, SERVICE_LABELS } from "@/utils";
import type { Quote, ServiceType } from "@/types";

const VOCAB: Record<"Mada→France" | "France→Mada", { departPays: string; arriveePays: string; depart: string[]; arrivee: string[] }> = {
  "Mada→France": { departPays: "Madagascar", arriveePays: "France", depart: CITIES_DEPART, arrivee: CITIES_ARRIVEE },
  "France→Mada": { departPays: "France", arriveePays: "Madagascar", depart: CITIES_ARRIVEE, arrivee: CITIES_DEPART },
};

const schema = z
  .object({
    direction: z.enum(["Mada→France", "France→Mada"]),
    originCity: z.string().min(1, "Ville de départ requise"),
    destinationCity: z.string().min(1, "Ville de destination requise"),
    serviceType: z.enum(["STANDARD", "EXPRESS", "ECONOMY"]),
    weightKg: z.coerce.number().positive("Poids positif requis").max(500, "Maximum 500 kg"),
    lengthCm: z.coerce.number().optional(),
    widthCm: z.coerce.number().optional(),
    heightCm: z.coerce.number().optional(),
  })
  .refine((v) => v.originCity !== v.destinationCity, { message: "Le départ et la destination doivent différer", path: ["destinationCity"] });

type FormValues = z.infer<typeof schema>;

export function CostCalculator() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { direction: "Mada→France", serviceType: "STANDARD" },
  });

  const direction = watch("direction");
  const cities = VOCAB[direction];

  const mutation = useMutation({
    mutationFn: async (values: FormValues) =>
      api<{ quote: Quote }>("/pricing/quote", {
        method: "POST",
        body: {
          originCountry: cities.departPays,
          originCity: values.originCity,
          destinationCountry: cities.arriveePays,
          destinationCity: values.destinationCity,
          serviceType: values.serviceType,
          weightKg: values.weightKg,
          lengthCm: values.lengthCm,
          widthCm: values.widthCm,
          heightCm: values.heightCm,
        },
      }),
    onSuccess: (data) => setQuote(data.quote),
  });

  const onDirectionChange = (value: string) => {
    const next = value as FormValues["direction"];
    setValue("direction", next);
    setValue("originCity", "");
    setValue("destinationCity", "");
    setOrigin(null);
    setDestination(null);
    setQuote(null);
  };

  const routeDistance = quote?.distanceKm;

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Calculator className="size-4 text-blue-600" />
          Simulateur de prix
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <LocationPicker
            label="Ville de départ"
            region={cities.departPays}
            options={cities.depart}
            value={origin?.city ?? ""}
            onChange={(loc) => {
              setOrigin(loc);
              setValue("originCity", loc.city);
              setQuote(null);
            }}
            placeholder="Choisir…"
            error={errors.originCity?.message}
          />
          <LocationPicker
            label="Ville de destination"
            region={cities.arriveePays}
            options={cities.arrivee}
            value={destination?.city ?? ""}
            onChange={(loc) => {
              setDestination(loc);
              setValue("destinationCity", loc.city);
              setQuote(null);
            }}
            placeholder="Choisir…"
            error={errors.destinationCity?.message}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Direction"
            options={[
              { value: "Mada→France", label: "Mada → France" },
              { value: "France→Mada", label: "France → Mada" },
            ]}
            value={direction}
            onChange={(e) => onDirectionChange(e.target.value)}
          />
          <Input label="Poids (kg)" type="number" step="0.1" min="0.1" placeholder="5" error={errors.weightKg?.message} {...register("weightKg")} />
          <Input label="Volume L (cm)" type="number" placeholder="40" helper="optionnel" {...register("lengthCm")} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Service"
            className="col-span-1"
            options={(Object.keys(SERVICE_LABELS) as ServiceType[]).map((s) => ({ value: s, label: SERVICE_LABELS[s] }))}
            {...register("serviceType")}
          />
        </div>

        <Button type="submit" loading={mutation.isPending} fullWidth>
          Estimer le prix
        </Button>
        {mutation.error && (
          <p className="text-center text-sm font-medium text-red-600 dark:text-red-400">
            {mutation.error instanceof Error ? mutation.error.message : "Impossible de calculer le prix."}
          </p>
        )}
      </form>

      <div className="space-y-4">
        <RouteMap origin={origin?.coordinates} destination={destination?.coordinates} distanceKm={routeDistance} />
        {quote ? (
          <PriceSummary quote={quote} />
        ) : (
          <div className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900">
            {mutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin text-blue-600" /> Calcul en cours…
              </span>
            ) : (
              "Remplissez le formulaire et lancez l'estimation pour voir le prix estimé par MadaColis."
            )}
          </div>
        )}
      </div>
    </div>
  );
}