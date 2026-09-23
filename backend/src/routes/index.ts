import { Router } from "express";
import authRoutes from "./auth.routes.js";
import addressesRoutes from "./addresses.routes.js";
import adminRoutes from "./admin.routes.js";
import docsRoutes from "./docs.routes.js";
import shipmentsRoutes from "./shipments.routes.js";
import pricingRoutes from "./pricing.routes.js";
import trackingRoutes from "./tracking.routes.js";
import paymentsRoutes from "./payments.routes.js";
import documentsRoutes from "./documents.routes.js";
import transitaireRoutes from "./transitaire.routes.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    name: "MadaColis API",
    version: "1.0.0",
    endpoints: ["/auth", "/addresses", "/shipments", "/tracking", "/pricing", "/payments", "/documents", "/admin", "/transitaire"],
    docs: "/docs",
  });
});

router.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

router.use("/docs", docsRoutes);
router.use("/auth", authRoutes);
router.use("/addresses", addressesRoutes);
router.use("/shipments", shipmentsRoutes);
router.use("/pricing", pricingRoutes);
router.use("/tracking", trackingRoutes);
router.use("/payments", paymentsRoutes);
router.use("/documents", documentsRoutes);
router.use("/transitaire", transitaireRoutes);
router.use("/admin", adminRoutes);

export default router;