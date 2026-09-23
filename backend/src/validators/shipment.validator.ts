import { z } from "zod";
import { ServiceType, ShipmentStatus, DocumentType, PaymentProvider, PaymentMethod, Currency } from "@prisma/client";

export const countryCitySchema = z.object({
  country: z.string().trim().min(2, "Pays requis").max(80),
  city: z.string().trim().min(1, "Ville requise").max(80),
});

export const geocodeQuerySchema = z.object({
  q: z.string().trim().min(2, "Recherche invalide").max(120),
});

export const amazonSearchQuerySchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  skip: z.coerce.number().int().min(0).max(100000).optional().default(0),
  category: z.string().trim().max(80).optional(),
});

export const analyzeLinkSchema = z.object({
  url: z.string().trim().url("Lien invalide").min(8).max(500),
});

export const shippingMethodSchema = z.enum(["AIR", "SEA"]);

export const productQuoteSchema = z.object({
  link: z.string().trim().url("Lien invalide").min(8).max(500).optional(),
  title: z.string().trim().min(1).max(300).optional(),
  quantity: z.coerce.number().int().min(1).max(99),
  weightKg: z.coerce.number().positive("Poids requis").max(500),
  lengthCm: z.coerce.number().positive().max(300).optional(),
  widthCm: z.coerce.number().positive().max(300).optional(),
  heightCm: z.coerce.number().positive().max(300).optional(),
  declaredValueEUR: z.coerce.number().nonnegative().max(1_000_000).optional(),
  shippingMethod: shippingMethodSchema.optional(),
  fragile: z.boolean().optional(),
  transitaireId: z.string().trim().max(40).optional(),
  destinationCountry: z.string().trim().min(2).max(80),
  destinationCity: z.string().trim().min(1).max(80),
  serviceType: z.enum(["STANDARD", "EXPRESS", "ECONOMY"]),
}).refine((data) => data.link || data.title, { message: "Lien ou titre produit requis", path: ["link"] });

export const quoteSchema = z.object({
  originCountry: z.string().trim().min(2, "Pays de départ requis").max(80),
  originCity: z.string().trim().min(1, "Ville de départ requise").max(80),
  destinationCountry: z.string().trim().min(2, "Pays de destination requis").max(80),
  destinationCity: z.string().trim().min(1, "Ville de destination requise").max(80),
  serviceType: z.enum([ServiceType.STANDARD, ServiceType.EXPRESS, ServiceType.ECONOMY]),
  shippingMethod: shippingMethodSchema.optional(),
  fragile: z.boolean().optional(),
  weightKg: z.coerce.number().positive("Poids positif requis").max(500, "Poids maximum : 500 kg"),
  lengthCm: z.coerce.number().positive().max(300).optional(),
  widthCm: z.coerce.number().positive().max(300).optional(),
  heightCm: z.coerce.number().positive().max(300).optional(),
  declaredValue: z.coerce.number().nonnegative().max(1_000_000).optional(),
});

export const shipmentItemSchema = z.object({
  description: z.string().trim().min(2, "Description du colis requise").max(300),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
  weight: z.coerce.number().positive("Poids positif requis").max(500),
  length: z.coerce.number().positive().max(300).optional(),
  width: z.coerce.number().positive().max(300).optional(),
  height: z.coerce.number().positive().max(300).optional(),
  declaredValue: z.coerce.number().nonnegative().max(1_000_000),
  isFragile: z.boolean().optional().default(false),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Nom requis").max(120),
  phone: z.string().trim().min(8, "Téléphone invalide").max(30),
  address: z.string().trim().max(255).optional(),
});

export const createShipmentSchema = z.object({
  origin: countryCitySchema,
  destination: countryCitySchema,
  serviceType: z.enum([ServiceType.STANDARD, ServiceType.EXPRESS, ServiceType.ECONOMY]),
  sender: contactSchema,
  recipient: contactSchema,
  items: z.array(shipmentItemSchema).min(1, "Au moins un article requis").max(20),
  notes: z.string().trim().max(500).optional(),
  requiredDocuments: z.array(z.enum(Object.keys(DocumentType) as [DocumentType, ...DocumentType[]])).optional().default([]),
  currency: z.enum([Currency.EUR, Currency.MGA, Currency.USD]).optional().default(Currency.EUR),
});

export const cancelShipmentSchema = z.object({
  reason: z.string().trim().min(2).max(300).optional(),
});

export const trackingParamsSchema = z.object({
  trackingNumber: z.string().trim().min(6, "Numéro de tracking invalide").max(40),
});

export const createPaymentSchema = z.object({
  shipmentId: z.string().uuid("Colis invalide"),
  provider: z.enum([PaymentProvider.MVOLA, PaymentProvider.ORANGE_MONEY, PaymentProvider.AIRTEL_MONEY, PaymentProvider.CARD, PaymentProvider.CASH]),
  method: z.enum([PaymentMethod.MOBILE_MONEY, PaymentMethod.CARD, PaymentMethod.CASH]),
});

export const listShipmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  status: z.enum([
    ShipmentStatus.PENDING,
    ShipmentStatus.RECEIVED,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.IN_CUSTOMS,
    ShipmentStatus.OUT_FOR_DELIVERY,
    ShipmentStatus.DELIVERED,
    ShipmentStatus.CANCELLED,
  ]).optional(),
  search: z.string().trim().max(60).optional(),
});