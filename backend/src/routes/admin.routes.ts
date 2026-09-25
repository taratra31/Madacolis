import { Router } from "express";
import {
  dashboard,
  listUsers,
  updateUser,
  deleteUser,
  listShipments,
  updateShipmentStatus,
  assignShipmentCarrier,
  listPayments,
  confirmPayment,
  listPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  listAudits,
  listTransitaires,
  listDocuments,
  exportCsv,
  createShipment,
  listCommissions,
  listTreasury,
  listNotifications,
} from "../controllers/admin.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import {
  updateUserStatusSchema,
  updateShipmentStatusSchema,
  pricingRuleSchema,
  createShipmentSchema,
} from "../validators/admin.validator.js";

const router = Router();

// Toutes les routes admin : JWT + rôle ADMIN (les AGENT peuvent voir, mais pas modifier)
router.use(authenticate);
router.use(authorize("ADMIN", "AGENT"));

router.get("/dashboard", authorize("ADMIN"), dashboard);
router.get("/users", authorize("ADMIN"), listUsers);
router.put("/users/:id", authorize("ADMIN"), validate(updateUserStatusSchema), updateUser);
router.delete("/users/:id", authorize("ADMIN"), deleteUser);
router.get("/shipments", listShipments);
router.post("/shipments", authorize("ADMIN"), validate(createShipmentSchema), createShipment);
router.put("/shipments/:id/status", authorize("ADMIN"), validate(updateShipmentStatusSchema), updateShipmentStatus);
router.put("/shipments/:id/carrier", validate(updateUserStatusSchema.pick({ carrierId: true })), assignShipmentCarrier);
router.get("/payments", listPayments);
router.put("/payments/:id/confirm", authorize("ADMIN"), confirmPayment);
router.get("/transitaires", authorize("ADMIN"), listTransitaires);
router.get("/commissions", authorize("ADMIN"), listCommissions);
router.get("/treasury", authorize("ADMIN"), listTreasury);
router.get("/notifications", listNotifications);
router.get("/documents", authorize("ADMIN"), listDocuments);
router.get("/export", authorize("ADMIN"), exportCsv);
router.get("/pricing-rules", listPricingRules);
router.post("/pricing-rules", authorize("ADMIN"), validate(pricingRuleSchema), createPricingRule);
router.put("/pricing-rules/:id", authorize("ADMIN"), validate(pricingRuleSchema.partial()), updatePricingRule);
router.delete("/pricing-rules/:id", authorize("ADMIN"), deletePricingRule);
router.get("/audits", authorize("ADMIN"), listAudits);

export default router;