import { env } from "./env.js";

export type AppConfig = {
  nodeEnv: typeof env.NODE_ENV;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  frontendUrl: string;
};

export const appConfig: AppConfig = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  frontendUrl: env.FRONTEND_URL,
};