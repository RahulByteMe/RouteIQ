import dotenv from "dotenv";
dotenv.config();

// ─── Server Configuration Constants ───────────────────────────────────────

export const PORT = process.env.PORT || 4000;
export const DATABASE_URL = process.env.DATABASE_URL || null;
export const JWT_SECRET = process.env.JWT_SECRET || "routeiq_super_secret_jwt_key_2026";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
export const OSRM_BASE_URL = process.env.OSRM_BASE_URL || "https://router.project-osrm.org";

export const CORS_CONFIG = {
    origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",")
        : ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
};

// Default Initial Hub & Stops: 🇮🇳 Delhi NCR Logistics Network
export const INITIAL_DEPOT = [28.6139, 77.2090]; // Connaught Place Central Hub, New Delhi

export const INITIAL_STOPS = [
    { id: 401, name: "Karol Bagh Commercial Market", position: [28.6517, 77.1906], priority: "urgent" },
    { id: 402, name: "Lajpat Nagar Central Market", position: [28.5677, 77.2433], priority: "standard" },
    { id: 403, name: "Nehru Place IT Hub", position: [28.5494, 77.2527], priority: "urgent" },
    { id: 404, name: "Cyber City DLF Phase 2", position: [28.4950, 77.0890], priority: "flexible" },
    { id: 405, name: "Noida Sector 18 Commercial Hub", position: [28.5708, 77.3260], priority: "standard" }
];
