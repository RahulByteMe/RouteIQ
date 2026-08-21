import { Router } from "express";
import { getPublishedRoute, publishRoute } from "../controllers/routesController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// GET published route is accessible by both Drivers and Dispatchers
router.get("/published", getPublishedRoute);

// Publishing a route is restricted to Dispatchers
router.post("/publish", requireAuth, requireRole("dispatcher"), publishRoute);

export default router;
