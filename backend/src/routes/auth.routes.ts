import { Router } from "express";
import {
  register,
  login,
  logout,
  me,
  updateProfile,
  changePassword,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import { rateLimit } from "../middlewares/rateLimiter.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/auth.validator.js";

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 50, message: "Trop de tentatives de connexion." });

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);
router.put("/profile", authenticate, validate(updateProfileSchema), updateProfile);
router.put("/password", authenticate, validate(changePasswordSchema), changePassword);

export default router;