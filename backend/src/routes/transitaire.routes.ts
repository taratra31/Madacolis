import { Router } from "express";
import {
  listShipments,
  getShipment,
  updateShipmentStatus,
  getStats,
  getClients,
  getPayments,
  exportShipments,
  getTeam,
  getDocuments,
  getRates,
  createShipment,
  getActivity,
  getNotifications,
} from "../controllers/transitaire.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { updateShipmentStatusSchema } from "../validators/admin.validator.js";

const router = Router();

// Espace transitaire : JWT + rôle TRANSITAIRE uniquement
router.use(authenticate);
router.use(authorize("TRANSITAIRE"));

router.get("/stats", getStats);
router.get("/rates", getRates);
router.get("/clients", getClients);
router.get("/payments", getPayments);
router.get("/team", getTeam);
router.get("/documents", getDocuments);
router.get("/audit", getActivity);
router.get("/notifications", getNotifications);
router.get("/export", exportShipments);
router.post("/shipments", createShipment);
router.get("/shipments", listShipments);
router.get("/shipments/:id", getShipment);
router.put("/shipments/:id/status", validate(updateShipmentStatusSchema), updateShipmentStatus);

export default router;