import stopRepository from "../db/repositories/stopRepository.js";

// ─── Stops Controller ──────────────────────────────────────────────────────

export const getStops = async (req, res) => {
    try {
        const stops = await stopRepository.getAll();
        res.json(stops);
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve stops", details: err.message });
    }
};

export const createStop = async (req, res) => {
    try {
        const { name, position, priority } = req.body;
        if (!name || !position || !Array.isArray(position) || position.length !== 2) {
            return res.status(400).json({
                error: "Invalid stop payload. Must include name and [lat, lng]."
            });
        }

        const newStop = await stopRepository.create({
            name,
            latitude: Number(position[0]),
            longitude: Number(position[1]),
            priority: priority || "standard",
            createdBy: req.user?.id || null
        });

        res.status(201).json(newStop);
    } catch (err) {
        res.status(500).json({ error: "Failed to create stop", details: err.message });
    }
};

export const setBatchStops = async (req, res) => {
    try {
        const { stops } = req.body;
        if (!stops || !Array.isArray(stops)) {
            return res.status(400).json({ error: "Invalid stops payload. Must be an array of stops." });
        }

        const savedStops = await stopRepository.setBatch(stops, req.user?.id || null);
        res.status(200).json(savedStops);
    } catch (err) {
        res.status(500).json({ error: "Failed to save batch stops", details: err.message });
    }
};

export const deleteStop = async (req, res) => {
    try {
        const stopId = Number(req.params.id);
        const deletedId = await stopRepository.delete(stopId);
        res.json({ message: "Stop deleted successfully", id: deletedId || stopId });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete stop", details: err.message });
    }
};

export default {
    getStops,
    createStop,
    setBatchStops,
    deleteStop
};
