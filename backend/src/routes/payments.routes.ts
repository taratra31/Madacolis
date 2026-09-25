import { Router } from "express";
import { listMyPayments, initiatePayment, demoConfirmPayment } from "../controllers/payments.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import { createPaymentSchema } from "../validators/shipment.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", listMyPayments);
router.post("/", validate(createPaymentSchema), initiatePayment);
router.post("/:id/demo-confirm", demoConfirmPayment);

export default router;