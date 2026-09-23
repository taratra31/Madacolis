import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Database, Download, FileSpreadsheet, FileText, Truck } from "lucide-react";
import { downloadTransitaireCsv, fetchTransitaireClients, fetchTransitairePayments, fetchTransitaireStats } from "@/services/transitaire";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";

function useExport(label: string, fn: () => Promise<Blob>) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const run = async () => {
    try {
      setState("busy");
      const blob = await fn();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = label;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setState("done");
    } finally {
      setTimeout(() => setState("idle"), 2500);
    }
  };
  return { state, run };
}

function csvBlob(rows: string[][]) {
  return new Blob([`\uFEFF${rows.map((r) => r.join(";")).join("\r\n")}`], { type: "text/csv;charset=utf-8" });
}

export function TransitaireExportPage() {
  const qStats = useQuery({ queryKey: ["transitaire-export-stats"], queryFn: () => fetchTransitaireStats() });
  const qClients = useQuery({ queryKey: ["transitaire-export-clients"], queryFn: () => fetchTransitaireClients({ pageSize: 100 }) });
  const qPayments = useQuery({ queryKey: ["transitaire-export-payments"], queryFn: () => fetchTransitairePayments({ pageSize: 100 }) });

  const ships = useExport("madacolis-colis.csv", () => downloadTransitaireCsv());
  const clients = useExport("madacolis-clients.csv", async () => {
    const data = qClients.data?.clients ?? [];
    return csvBlob(
      [["Nom", "Email", "Téléphone", "Ville", "Colis", "Livrés", "CA (Ar)"], ...data.map((c) => [c.name, c.email ?? "", c.phone ?? "", c.city ?? "", String(c.shipments), String(c.delivered), String(c.revenueAr)])],
    );
  });
  const payments = useExport("madacolis-paiements.csv", async () => {
    const data = qPayments.data?.payments ?? [];
    return csvBlob(
      [["Colis", "Référence", "Montant", "Devise", "Statut", "Date"], ...data.map((p) => [p.trackingNumber, p.paymentReference, String(p.amount), p.currency, p.status, p.paidAt ?? p.createdAt])],
    );
  });
  const rapports = useExport("madacolis-rapports.csv", async () => {
    const months = qStats.data?.stats.volumeByMonth ?? [];
    return csvBlob(
      [["Mois", "Colis", "Livrés", "CA (Ar)"], ...months.map((m) => [m.label, String(m.total), String(m.delivered), String(m.revenueAr)])],
    );
  });

  if (qStats.isLoading || qClients.isLoading || qPayments.isLoading) return <LoadingState label="Préparation des données…" />;
  if (qStats.isError || qClients.isError || qPayments.isError) {
    return <ErrorState message="Impossible de charger les données d'export." />;
  }

  const items: { title: string; desc: string; state: "idle" | "busy" | "done"; onClick: () => void; icon: typeof Truck }[] = [
    { title: "Colis (CSV)", desc: "Toutes les expéditions avec leurs statuts.", state: ships.state, onClick: ships.run, icon: Truck },
    { title: "Clients (CSV)", desc: "Vos clients et leur activité.", state: clients.state, onClick: clients.run, icon: FileSpreadsheet },
    { title: "Paiements (CSV)", desc: "Historique des paiements.", state: payments.state, onClick: payments.run, icon: FileText },
    { title: "Rapports mensuels (CSV)", desc: "Volumes et CA par mois.", state: rapports.state, onClick: rapports.run, icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          <Database className="mr-2 inline size-6 text-indigo-600 dark:text-indigo-400" />
          Export des données
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Téléchargez vos données en CSV (séparateur « ; », encodage UTF-8).</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Card key={item.title}>
            <CardBody className="flex items-start justify-between gap-4 p-5">
              <div className="flex items-start gap-3">
                <item.icon className="mt-0.5 size-5 shrink-0 text-indigo-500" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" loading={item.state === "busy"} onClick={() => void item.onClick()}>
                <Download className="size-4" /> {item.state === "done" ? "OK" : "Télécharger"}
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Données brutes (JSON)</h2>
        </CardHeader>
        <CardBody>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Téléchargement des statistiques complètes au format JSON pour vos analyses.</p>
          <Button
            variant="outline"
            onClick={() => {
              const blob = new Blob([JSON.stringify(qStats.data?.stats, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "madacolis-stats.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="size-4" /> Stats JSON
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}