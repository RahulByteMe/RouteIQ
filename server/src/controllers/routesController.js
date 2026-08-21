import routeRepository from "../db/repositories/routeRepository.js";

// ─── Routes Controller ─────────────────────────────────────────────────────

export const getPublishedRoute = async (req, res) => {
    try {
        const route = await routeRepository.getPublished();
        res.json(route || { message: "No active route published" });
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve published route", details: err.message });
    }
};

export const publishRoute = async (req, res) => {
    try {
        const { depot, stops, osrmRoute, osrmDistance, benchmark } = req.body;
        if (!depot || !stops || !Array.isArray(stops)) {
            return res.status(400).json({ error: "Invalid route publish payload." });
        }

        const routePayload = await routeRepository.publish({
            depot,
            stops,
            osrmRoute: osrmRoute || [],
            osrmDistance: osrmDistance || 0,
            benchmark: benchmark || null,
            createdBy: req.user?.id || null
        });

        // Broadcast to all connected clients via Socket.IO
        const io = req.app.get("io");
        if (io) {
            io.emit("dispatcher:route_published", routePayload);
        }

        res.status(201).json(routePayload);
    } catch (err) {
        res.status(500).json({ error: "Failed to publish route", details: err.message });
    }
};

export default {
    getPublishedRoute,
    publishRoute
};
