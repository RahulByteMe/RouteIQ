import { store } from "../models/store.js";

// ─── Telemetry Controller ──────────────────────────────────────────────────

export const getTelemetry = (req, res) => {
    try {
        const telemetry = store.getDriverTelemetry();
        res.json(telemetry);
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve telemetry", details: err.message });
    }
};
