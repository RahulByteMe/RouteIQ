import express from "express";
import cors from "cors";
import { CORS_CONFIG } from "./config/constants.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import apiRouter from "./routes/index.js";

// ─── Express Application Setup ─────────────────────────────────────────────

export const createApp = () => {
    const app = express();

    // Trust proxy headers for Docker / Nginx
    app.set("trust proxy", 1);

    // Middleware
    app.use(cors(CORS_CONFIG));
    app.use(express.json({ limit: "1mb" }));
    app.use(rateLimiter({ windowMs: 60000, maxRequests: 200 }));

    // API Routes
    app.use("/api", apiRouter);

    // Global 404 Handler
    app.use((req, res) => {
        res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
    });

    // Global Error Handler
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, next) => {
        console.error("Unhandled server error:", err);
        res.status(500).json({
            error: "Internal Server Error",
            message: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : err.message
        });
    });

    return app;
};

export default createApp;
