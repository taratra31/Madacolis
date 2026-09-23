import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openapiSpec } from "../docs/swagger.js";

const router = Router();

// Spécification OpenAPI brute
router.get("/json", (_req, res) => {
  res.json(openapiSpec);
});

// Interface Swagger UI
router.use("/", swaggerUi.serve);
router.get("/", swaggerUi.setup(openapiSpec, {
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
  customSiteTitle: "MadaColis API — Documentation",
}));

export default router;