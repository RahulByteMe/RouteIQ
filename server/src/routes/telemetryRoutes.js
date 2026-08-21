import { Router } from "express";
import { getTelemetry } from "../controllers/telemetryController.js";

const router = Router();

router.get("/telemetry", getTelemetry);

export default router;
