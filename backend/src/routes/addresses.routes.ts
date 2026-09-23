import { Router } from "express";
import {
  listAddresses,
  createAddress,
  getAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import { createAddressSchema, updateAddressSchema } from "../validators/address.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", listAddresses);
router.post("/", validate(createAddressSchema), createAddress);
router.get("/:id", getAddress);
router.put("/:id", validate(updateAddressSchema), updateAddress);
router.delete("/:id", deleteAddress);

export default router;