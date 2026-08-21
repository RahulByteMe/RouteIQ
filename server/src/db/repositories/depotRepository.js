import { query, isDbConnected } from "../connection.js";
import { store } from "../../models/store.js";

// ─── Depot Repository (Unified Database + In-Memory Access) ────────────────

export const depotRepository = {
    async get() {
        if (isDbConnected()) {
            const res = await query("SELECT * FROM depots ORDER BY id DESC LIMIT 1");
            if (res.rows.length === 0) return null;
            const row = res.rows[0];
            return [row.latitude, row.longitude];
        }
        return store.getDepot();
    },

    async set(depotCoords, name = "Main Depot Hub", createdBy = null) {
        if (!depotCoords || !Array.isArray(depotCoords) || depotCoords.length < 2) {
            throw new Error("Invalid depot coordinates.");
        }

        const [lat, lng] = depotCoords;

        if (isDbConnected()) {
            const res = await query(
                `INSERT INTO depots (name, latitude, longitude, created_by)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [name, lat, lng, createdBy]
            );
            const row = res.rows[0];
            return [row.latitude, row.longitude];
        }

        return store.setDepot([Number(lat), Number(lng)]);
    }
};

export default depotRepository;
