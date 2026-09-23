import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  AMAZON_ACCESS_KEY: z.string().optional(),
  AMAZON_SECRET_KEY: z.string().optional(),
  AMAZON_PARTNER_TAG: z.string().optional(),
  AMAZON_HOST: z.string().default("webservices.amazon.fr"),
  AMAZON_REGION: z.string().default("eu-west-1"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Configuration invalide :", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;