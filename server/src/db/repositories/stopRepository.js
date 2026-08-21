import { query, isDbConnected, getPool } from "../connection.js";
import { store } from "../../models/store.js";

// ─── Stop Repository (Unified Database + In-Memory Access) ─────────────────

export const stopRepository = {
    async getAll() {
        if (isDbConnected()) {
            const res = await query("SELECT * FROM stops ORDER BY id ASC");
            return res.rows.map(row => ({
                id: row.id,
                name: row.name,
                position: [row.latitude, row.longitude],
                priority: row.priority,
                status: row.status,
                createdAt: row.created_at
            }));
        }
        return store.getStops();
    },

    async getById(id) {
        if (isDbConnected()) {
            const res = await query("SELECT * FROM stops WHERE id = $1", [id]);
            if (res.rows.length === 0) return null;
            const row = res.rows[0];
            return {
                id: row.id,
                name: row.name,
                position: [row.latitude, row.longitude],
                priority: row.priority,
                status: row.status,
                createdAt: row.created_at
            };
        }
        return store.getStops().find(s => s.id === Number(id)) || null;
    },

    async create({ name, latitude, longitude, priority = "standard", createdBy = null }) {
        if (isDbConnected()) {
            const res = await query(
                `INSERT INTO stops (name, latitude, longitude, priority, created_by)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [name, latitude, longitude, priority, createdBy]
            );
            const row = res.rows[0];
            return {
                id: row.id,
                name: row.name,
                position: [row.latitude, row.longitude],
                priority: row.priority,
                status: row.status,
                createdAt: row.created_at
            };
        }

        const newStop = {
            id: Date.now(),
            name,
            position: [Number(latitude), Number(longitude)],
            priority,
            status: "pending"
        };
        return store.addStop(newStop);
    },

    async setBatch(stops, createdBy = null) {
        if (isDbConnected()) {
            const pool = getPool();
            const client = await pool.connect();
            try {
                await client.query("BEGIN");
                await client.query("DELETE FROM stops");

                const savedStops = [];
                for (const s of stops) {
                    const res = await client.query(
                        `INSERT INTO stops (name, latitude, longitude, priority, created_by)
                         VALUES ($1, $2, $3, $4, $5)
                         RETURNING *`,
                        [s.name, s.position[0], s.position[1], s.priority || "standard", createdBy]
                    );
                    const row = res.rows[0];
                    savedStops.push({
                        id: row.id,
                        name: row.name,
                        position: [row.latitude, row.longitude],
                        priority: row.priority,
                        status: row.status,
                        createdAt: row.created_at
                    });
                }

                await client.query("COMMIT");
                store.stops = [...savedStops];
                return savedStops;
            } catch (err) {
                await client.query("ROLLBACK");
                throw err;
            } finally {
                client.release();
            }
        }

        store.stops = stops.map((s, idx) => ({
            id: s.id || Date.now() + idx,
            name: s.name,
            position: [Number(s.position[0]), Number(s.position[1])],
            priority: s.priority || "standard",
            status: "pending"
        }));
        return store.getStops();
    },

    async delete(id) {
        if (isDbConnected()) {
            const res = await query("DELETE FROM stops WHERE id = $1 RETURNING id", [id]);
            return res.rows.length > 0 ? res.rows[0].id : null;
        }
        return store.deleteStop(Number(id));
    }
};

export default stopRepository;
