import type { Currency, DocumentType, PaymentStatus, ServiceType, ShipmentStatus } from "@/types";

/** Fusionne des noms de classes conditionnels. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number, currency: Currency | string = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Taux de change fixe EUR → MGA utilisé pour l'affichage (affiche aussi les Ariary sans appeler le backend). */
export const EUR_TO_MGA = 5000;

/** Formate un montant en Ariary malgache (arrondi à l'ariary, sans décimales). */
export function formatAriary(amountEUR: number): string {
  const mga = Math.round(amountEUR * EUR_TO_MGA);
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(mga) + " Ar";
}

/** Formate un montant DÉJÀ en Ariary (tarifs/montants Ar) — sans conversion. */
export function formatAr(amountAr: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(amountAr)) + " Ar";
}

/** Affiche un montant en EUR + Ariary (ex : « 12,50 € · 62 500 Ar »). */
export function formatDual(amountEUR: number): string {
  return `${formatCurrency(amountEUR, "EUR")} · ${formatAriary(amountEUR)}`;
}

export function formatDate(value: string | Date | null | undefined, withTime = false): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export const SERVICE_LABELS: Record<ServiceType, string> = {
  STANDARD: "Standard",
  EXPRESS: "Express",
  ECONOMY: "Économique",
};

export const SERVICE_DESCRIPTIONS: Record<ServiceType, string> = {
  STANDARD: "Le meilleur rapport qualité / prix pour vos envois réguliers.",
  EXPRESS: "Livraison prioritaire en quelques jours. Idéal pour l'urgent.",
  ECONOMY: "Le tarif le plus avantageux pour les colis lourds ou volumineux.",
};

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  PENDING: "En attente",
  RECEIVED: "Reçu",
  IN_TRANSIT: "En transit",
  IN_CUSTOMS: "En douane",
  OUT_FOR_DELIVERY: "En cours de livraison",
  DELIVERED: "Livré",
  CANCELLED: "Annulé",
};

export const STATUS_ORDER: ShipmentStatus[] = ["PENDING", "RECEIVED", "IN_TRANSIT", "IN_CUSTOMS", "OUT_FOR_DELIVERY", "DELIVERED"];

export const STATUS_STYLES: Record<ShipmentStatus, string> = {
  PENDING: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  RECEIVED: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800",
  IN_TRANSIT: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  IN_CUSTOMS: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-800",
  OUT_FOR_DELIVERY: "bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:ring-cyan-800",
  DELIVERED: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "En attente",
  PAID: "Payé",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
};

export const PROVIDER_LABELS: Record<string, string> = {
  MVOLA: "MVola",
  ORANGE_MONEY: "Orange Money",
  AIRTEL_MONEY: "Airtel Money",
  CARD: "Carte bancaire",
  CASH: "Espèces",
};

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  IDENTITY: "Pièce d'identité",
  INVOICE: "Facture",
  PROOF_OF_ADDRESS: "Justificatif de domicile",
  CUSTOMS_FORM: "Formulaire douanier",
};

export const CITIES_DEPART: string[] = ["Antananarivo", "Toamasina", "Antsiranana", "Mahajanga", "Fianarantsoa", "Toliara", "Nosy Be"];
export const CITIES_ARRIVEE: string[] = ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Bordeaux", "Lille"];

export const CONTACT_EMAIL = "madaorganisation@gmail.com";
export const WHATSAPP_NUMBER = "+261326321784";

export function whatsappLink(message?: string): string {
  const text = encodeURIComponent(
    message ?? "Bonjour MadaColis, j'aimerais avoir des informations sur un envoi de colis.",
  );
  return `https://wa.me/${WHATSAPP_NUMBER.replace("+", "")}?text=${text}`;
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}