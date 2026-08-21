import depotRepository from "../db/repositories/depotRepository.js";

// ─── Depot Controller ──────────────────────────────────────────────────────

export const getDepot = async (req, res) => {
    try {
        const depot = await depotRepository.get();
        res.json({ depot });
    } catch (err) {
        res.status(500).json({ error: "Failed to retrieve depot", details: err.message });
    }
};

export const setDepot = async (req, res) => {
    try {
        const { depot } = req.body;
        if (!depot || !Array.isArray(depot) || depot.length !== 2) {
            return res.status(400).json({ error: "Invalid depot payload. Must be [lat, lng]." });
        }

        const formattedDepot = [Number(depot[0]), Number(depot[1])];
        const saved = await depotRepository.set(formattedDepot, "Dispatch Depot", req.user?.id || null);
        res.json({ depot: saved });
    } catch (err) {
        res.status(500).json({ error: "Failed to update depot", details: err.message });
    }
};

export default {
    getDepot,
    setDepot
};
