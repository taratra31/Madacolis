import { z } from "zod";
import { Role, ShipmentStatus, ServiceType, Currency, DocumentType } from "@prisma/client";

export const updateUserStatusSchema = z.object({
  role: z.enum([Role.CUSTOMER, Role.AGENT, Role.ADMIN, Role.TRANSITAIRE]).optional(),
  isActive: z.boolean().optional(),
  carrierId: z.string().trim().max(50).nullable().optional(),
});

export const createShipmentSchema = z.object({
  userId: z.string().trim().min(1, "Choisissez un client"),
  carrierId: z.string().trim().max(50).nullable().optional(),
  serviceType: z.enum([ServiceType.STANDARD, ServiceType.EXPRESS, ServiceType.ECONOMY]).default(ServiceType.STANDARD),
  origin: z.object({ country: z.string().trim().min(1), city: z.string().trim().min(1) }),
  destination: z.object({ country: z.string().trim().min(1), city: z.string().trim().min(1) }),
  sender: z.object({ name: z.string().trim().optional(), phone: z.string().trim().optional(), address: z.string().trim().optional() }).optional(),
  recipient: z.object({ name: z.string().trim().optional(), phone: z.string().trim().optional(), address: z.string().trim().optional() }).optional(),
  requiredDocuments: z.array(z.nativeEnum(DocumentType)).optional().default([]),
  notes: z.string().trim().max(1000).optional(),
  items: z.array(
    z.object({
      name: z.string().trim().min(1).max(200),
      quantity: z.coerce.number().int().min(1),
      weight: z.coerce.number().min(0.01).max(100000),
      declaredValue: z.coerce.number().nonnegative().optional().default(0),
      length: z.coerce.number().nonnegative().optional(),
      width: z.coerce.number().nonnegative().optional(),
      height: z.coerce.number().nonnegative().optional(),
    }),
  ).min(1, "Ajoutez au moins un article"),
});

export const updateShipmentStatusSchema = z.object({
  status: z.enum([
    ShipmentStatus.PENDING,
    ShipmentStatus.RECEIVED,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.IN_CUSTOMS,
    ShipmentStatus.OUT_FOR_DELIVERY,
    ShipmentStatus.DELIVERED,
    ShipmentStatus.CANCELLED,
  ]),
  comment: z.string().trim().max(500).optional(),
  location: z.string().trim().max(200).optional(),
});

export const pricingRuleSchema = z.object({
  name: z.string().trim().min(2).max(120),
  originCountry: z.string().trim().min(1).max(80),
  destinationCountry: z.string().trim().min(1).max(80),
  serviceType: z.enum([ServiceType.STANDARD, ServiceType.EXPRESS, ServiceType.ECONOMY]),
  basePrice: z.coerce.number().nonnegative(),
  pricePerKg: z.coerce.number().nonnegative(),
  pricePerKm: z.coerce.number().nonnegative().nullable().optional(),
  minimumPrice: z.coerce.number().nonnegative(),
  currency: z.enum([Currency.EUR, Currency.MGA, Currency.USD]).default(Currency.MGA),
  isActive: z.boolean().optional().default(true),
});