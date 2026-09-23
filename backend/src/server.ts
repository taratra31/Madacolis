import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import https from "node:https";
import { createApp } from "./app.js";
import { appConfig } from "./config/index.js";
import { prisma } from "./config/prisma.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTTPS_PORT = Number(process.env.ADMIN_HTTPS_PORT ?? 5443);

async function main(): Promise<void> {
  const app = createApp();

  // Vérifie la connexion à la base avant de démarrer
  await prisma.$queryRaw`SELECT 1`;
  console.log("✅ Connexion PostgreSQL établie");

  const httpServer = http.createServer(app);
  httpServer.listen(appConfig.port, () => {
    console.log(
      `🚀 MadaColis API + interface démarrées sur http://localhost:${appConfig.port} (${appConfig.nodeEnv})`,
    );
  });

  // Interface admin en HTTPS (évite l'auto-upgrade HTTP→HTTPS des navigateurs)
  const certDir = path.join(__dirname, "..", "certs");
  const certPath = path.join(certDir, "cert.pem");
  const keyPath = path.join(certDir, "key.pem");
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const httpsServer = https.createServer(
      { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) },
      app,
    );
    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`🔒 Interface admin (HTTPS) : https://localhost:${HTTPS_PORT}`);
    });
  } else {
    console.warn(`⚠️  Sertificat absent (${certPath}) — HTTPS désactivé.`);
  }
}

main().catch((err) => {
  console.error("❌ Échec du démarrage :", err);
  process.exit(1);
});