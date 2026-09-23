import { Router } from "express";
import { quoteShipment } from "../controllers/shipments.controller.js";
import { listServices } from "../services/pricing.service.js";
import { geocodePlace } from "../services/distance.service.js";
import { analyzeProductUrl } from "../services/product-analysis.service.js";
import { quoteProduct } from "../services/product-quote.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middlewares/validate.js";
import { geocodeQuerySchema, quoteSchema, analyzeLinkSchema, productQuoteSchema, amazonSearchQuerySchema } from "../validators/shipment.validator.js";
import { isAmazonPaapiConfigured, searchAmazonProducts, getAmazonProduct } from "../services/amazon-paapi.service.js";
import { searchCuratedAmazon, getCuratedProductById, getCategoryTree } from "../services/marketplace-curated.service.js";
import { listTransitaires } from "../services/transitaire.service.js";

const router = Router();

router.get("/services", asyncHandler(async (_req, res) => {
  const services = await listServices();
  res.json({ success: true, services });
}));

router.get("/geocode", validate(geocodeQuerySchema, "query"), asyncHandler(async (req, res) => {
  const place = await geocodePlace(String(req.query.q));
  if (!place) return res.status(404).json({ success: false, message: "Ville introuvable" });
  res.json({
    success: true,
    data: {
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      formattedAddress: place.formattedAddress,
    },
  });
}));

router.get("/marketplace/categories", asyncHandler(async (_req, res) => {
  const categories = await getCategoryTree();
  res.json({ success: true, categories });
}));

router.get("/marketplace/transitaires", asyncHandler(async (_req, res) => {
  res.json({ success: true, transitaires: listTransitaires() });
}));

router.get("/marketplace/amazon/search", validate(amazonSearchQuerySchema, "query"), asyncHandler(async (req, res) => {
  const q = String(req.query.q ?? "");
  const limit = Number(req.query.limit ?? 20);
  const skip = Number(req.query.skip ?? 0);
  const category = req.query.category ? String(req.query.category) : undefined;

  if (!isAmazonPaapiConfigured()) {
    const result = await searchCuratedAmazon(q, limit, skip, category);
    return res.json({ success: true, source: "curated", products: result.products, total: result.total });
  }

  const products = await searchAmazonProducts(q, limit);
  res.json({ success: true, source: "paapi", products, total: products.length });
}));

router.get("/marketplace/amazon/product/:id", asyncHandler(async (req, res) => {
  const id = String(req.params.id);

  const curated = await getCuratedProductById(id);
  if (curated) return res.json({ success: true, source: "curated", product: curated });

  if (isAmazonPaapiConfigured() && /^[A-Z0-9]{10}$/.test(id)) {
    const real = await getAmazonProduct(id);
    if (real) return res.json({ success: true, source: "paapi", product: real });
  }

  res.status(404).json({ success: false, message: "Produit introuvable" });
}));

router.get("/marketplace/products", validate(amazonSearchQuerySchema, "query"), asyncHandler(async (_req, res) => {
  const limit = Number(_req.query.limit ?? 24);
  const skip = Number(_req.query.skip ?? 0);
  const category = _req.query.category ? String(_req.query.category) : undefined;
  const result = await searchCuratedAmazon("", limit, skip, category);
  res.json({ success: true, source: "curated", products: result.products, total: result.total });
}));

router.post("/quote", validate(quoteSchema), quoteShipment);

router.post("/analyze-link", validate(analyzeLinkSchema), asyncHandler(async (req, res) => {
  const product = await analyzeProductUrl(String(req.body.url));
  res.json({ success: true, product });
}));

router.post("/product-quote", validate(productQuoteSchema), asyncHandler(async (req, res) => {
  const result = await quoteProduct(
    {
      link: req.body.link ? String(req.body.link) : undefined,
      title: req.body.title ? String(req.body.title) : undefined,
      quantity: Number(req.body.quantity),
      weightKg: Number(req.body.weightKg),
      lengthCm: req.body.lengthCm ? Number(req.body.lengthCm) : undefined,
      widthCm: req.body.widthCm ? Number(req.body.widthCm) : undefined,
      heightCm: req.body.heightCm ? Number(req.body.heightCm) : undefined,
      declaredValueEUR: req.body.declaredValueEUR ? Number(req.body.declaredValueEUR) : undefined,
      isAutomated: true,
      transitaireId: req.body.transitaireId ? String(req.body.transitaireId) : undefined,
    },
    String(req.body.destinationCountry),
    String(req.body.destinationCity),
    req.body.serviceType as "STANDARD" | "EXPRESS" | "ECONOMY",
    req.body.shippingMethod as "AIR" | "SEA" | undefined,
  );
  res.json({ success: true, ...result });
}));

export default router;