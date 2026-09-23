import { Router } from "express";
import { trackShipment } from "../controllers/tracking.controller.js";
import { validate } from "../middlewares/validate.js";
import { trackingParamsSchema } from "../validators/shipment.validator.js";

const router = Router();

router.get("/:trackingNumber", validate(trackingParamsSchema, "params"), trackShipment);

export default router;