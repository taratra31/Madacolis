import { Router } from "express";
import { createShipment, listShipments, getShipment, getShipmentTracking, cancelShipment } from "../controllers/shipments.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import { createShipmentSchema, cancelShipmentSchema, listShipmentsQuerySchema } from "../validators/shipment.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", validate(listShipmentsQuerySchema, "query"), listShipments);
router.post("/", validate(createShipmentSchema), createShipment);
router.get("/:id", getShipment);
router.get("/:id/tracking", getShipmentTracking);
router.post("/:id/cancel", validate(cancelShipmentSchema), cancelShipment);

export default router;