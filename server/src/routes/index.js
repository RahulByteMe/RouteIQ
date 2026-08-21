import { Router } from "express";
import authRoutes from "./authRoutes.js";
import stopsRoutes from "./stopsRoutes.js";
import depotRoutes from "./depotRoutes.js";
import routesRoutes from "./routesRoutes.js";
import telemetryRoutes from "./telemetryRoutes.js";

const apiRouter = Router();

// Health check
apiRouter.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Sub-routes
apiRouter.use("/auth", authRoutes);
apiRouter.use("/stops", stopsRoutes);
apiRouter.use("/depot", depotRoutes);
apiRouter.use("/routes", routesRoutes);
apiRouter.use("/driver", telemetryRoutes);

export default apiRouter;
