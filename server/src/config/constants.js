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

export const INITIAL_STOPS = [
    { id: 101, name: "Central Park West", position: [40.7829, -73.9654], priority: "urgent" },
    { id: 102, name: "Empire State Plaza", position: [40.7484, -73.9857], priority: "standard" },
    { id: 103, name: "Grand Central Terminal", position: [40.7527, -73.9772], priority: "urgent" },
    { id: 104, name: "Chelsea Market", position: [40.7420, -74.0048], priority: "standard" }
];

export const INITIAL_DEPOT = [40.7580, -73.9855]; // Manhattan Central Hub
