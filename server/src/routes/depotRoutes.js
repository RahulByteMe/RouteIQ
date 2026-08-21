import { Router } from "express";
import { getDepot, setDepot } from "../controllers/depotController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getDepot);
router.post("/", requireAuth, requireRole("dispatcher"), setDepot);

export default router;
