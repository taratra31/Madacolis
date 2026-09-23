import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Le nom est requis").max(120),
  email: z.string().trim().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().trim().min(8, "Téléphone invalide").max(30),
  password: z.string().min(8, "Mot de passe : minimum 8 caractères").max(100),
  country: z.string().trim().max(80).optional().default("Madagascar"),
  city: z.string().trim().max(80).optional(),
  address: z.string().trim().max(255).optional(),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Email ou téléphone requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email("Email invalide").optional().or(z.literal("")),
    phone: z.string().trim().min(8).max(30).optional(),
    country: z.string().trim().max(80).optional(),
    city: z.string().trim().max(80).optional(),
    address: z.string().trim().max(255).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Aucun champ à mettre à jour" });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "Nouveau mot de passe : minimum 8 caractères").max(100),
});