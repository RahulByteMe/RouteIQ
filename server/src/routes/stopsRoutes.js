import { Router } from "express";
import { getStops, createStop, setBatchStops, deleteStop } from "../controllers/stopsController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// GET is accessible by both drivers and dispatchers
router.get("/", getStops);

// Modifying stops is restricted to Dispatchers
router.post("/", requireAuth, requireRole("dispatcher"), createStop);
router.post("/batch", requireAuth, requireRole("dispatcher"), setBatchStops);
router.delete("/:id", requireAuth, requireRole("dispatcher"), deleteStop);

export default router;
