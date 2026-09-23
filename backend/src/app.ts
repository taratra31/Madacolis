import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Prisma } from "@prisma/client";
import { appConfig } from "./config/index.js";
import apiRoutes from "./routes/index.js";
import { ApiError } from "./utils/ApiError.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Origines autorisées par CORS.
 * — frontendUrl (config) + ports Vite (admin) : whitelist de prod
 * — Expo web dev : localhost:8081, toute IP LAN :8081 et tunnels trycloudflare → utilisés par MadaColis mobile
 */
const corsOrigin =
  process.env.NODE_ENV === "production"
    ? [
        appConfig.frontendUrl,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
      ]
    : (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) return cb(null, true); // pas d'origine (mobile natif / curl)
        const allow =
          origin === appConfig.frontendUrl ||
          /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin) ||
          /^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(origin) ||
          /^https:\/\/[a-z0-9-]+\.onrender\.com$/.test(origin) ||
          /^https?:\/\/localhost:8081$/.test(origin) ||
          /^https?:\/\/(\d{1,3}\.){3}\d{1,3}:8081$/.test(origin) ||
          /^https?:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(origin) ||
          /^http:\/\/localhost:517[3-8]$/.test(origin);
        cb(null, allow);
      };

function isPrismaError(err: unknown): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError;
}

export function createApp(): express.Express {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginOpenerPolicy: false,
      originAgentCluster: false,
    }),
  );
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Routes de l'API
  app.use("/api/v1", apiRoutes);

  // Interface admin (dist build) servie à la racine
  const adminDist = path.resolve(__dirname, "../../admin/dist");
  if (fs.existsSync(adminDist)) {
    app.use(express.static(adminDist));
    // Téléchargement du certificat CA (installation sur les appareils)
    const caPath = path.resolve(__dirname, "../certs/ca-cert.pem");
    if (fs.existsSync(caPath)) {
      app.get("/ca.pem", (_req, res) => {
        res.setHeader("Content-Type", "application/x-x509-ca-cert");
        res.sendFile(caPath);
      });
    }
    // SPA fallback : toutes les routes GET non-API renvoient index.html
    app.use((req, res, next) => {
      if (req.method === "GET" && !req.path.startsWith("/api")) {
        res.sendFile(path.join(adminDist, "index.html"));
      } else {
        next();
      }
    });
  }

  // 404
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: "Route introuvable",
      code: "NOT_FOUND",
      path: req.originalUrl,
    });
  });

  // Gestion globale des erreurs (ApiError + erreurs inconnues)
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ApiError) {
      res.status(err.statusCode).json({
        success: false,
        message: err.message,
        code: err.code,
      });
      return;
    }
    if (isPrismaError(err)) {
      if (err.code === "P2002") {
        res.status(409).json({ success: false, message: "Conflit : une ressource identique existe déjà", code: "CONFLICT" });
        return;
      }
      if (err.code === "P2025") {
        res.status(404).json({ success: false, message: "Ressource introuvable", code: "NOT_FOUND" });
        return;
      }
      if (err.code === "P2003") {
        res.status(400).json({ success: false, message: "Référence invalide vers une autre ressource", code: "BAD_REQUEST" });
        return;
      }
    }
    if (err instanceof SyntaxError && "body" in err) {
      res.status(400).json({ success: false, message: "JSON invalide", code: "BODY_PARSE_ERROR" });
      return;
    }
    console.error("Erreur non gérée :", err);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      code: "INTERNAL_ERROR",
    });
  });

  return app;
}