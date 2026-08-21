import express from "express";
import cors from "cors";
import { CORS_CONFIG } from "./config/constants.js";
import apiRouter from "./routes/index.js";

// ─── Express Application Setup ─────────────────────────────────────────────

export const createApp = () => {
    const app = express();

    // Middleware
    app.use(cors(CORS_CONFIG));
    app.use(express.json());

    // API Routes
    app.use("/api", apiRouter);

    // Global 404 Handler
    app.use((req, res) => {
        res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
    });

    return app;
};

export default createApp;
