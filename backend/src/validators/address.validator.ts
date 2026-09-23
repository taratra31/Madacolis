import { z } from "zod";

export const createAddressSchema = z.object({
  label: z.string().trim().min(1, "Libellé requis").max(80),
  country: z.string().trim().min(1).max(80),
  city: z.string().trim().min(1).max(80),
  region: z.string().trim().max(80).optional(),
  addressLine: z.string().trim().min(3, "Adresse invalide").max(255),
  postalCode: z.string().trim().max(20).optional(),
  phone: z.string().trim().min(8).max(30),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();