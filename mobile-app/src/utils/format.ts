import type { CatalogProduct } from "../types";

const EUR_TO_MGA = 5000;

export function priceOf(product: CatalogProduct): number {
  return product.priceEUR ?? 0;
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

export function formatAriary(amountEUR: number): string {
  return formatAr(amountEUR * EUR_TO_MGA);
}

export function formatAr(amountAr: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(amountAr)) + " Ar";
}

export const CITIES_MG = ["Antananarivo", "Toamasina", "Antsiranana", "Mahajanga", "Fianarantsoa", "Toliara", "Nosy Be"];

export const WHATSAPP_NUMBER = "261326321784";

export function whatsappLink(message?: string): string {
  const text = encodeURIComponent(message ?? "Bonjour MadaColis, j'aimerais avoir des informations sur un envoi de colis.");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}