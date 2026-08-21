import { query, isDbConnected, getPool } from "../connection.js";
import { store } from "../../models/store.js";

// ─── Route Repository (Unified Database + In-Memory Access) ────────────────

export const routeRepository = {
    async getPublished() {
        if (isDbConnected()) {
            const routeRes = await query(
                `SELECT r.*, d.latitude as depot_lat, d.longitude as depot_lng
                 FROM routes r
                 LEFT JOIN depots d ON r.depot_id = d.id
                 WHERE r.status IN ('published', 'in_progress', 'assigned')
                 ORDER BY r.id DESC LIMIT 1`
            );

            if (routeRes.rows.length === 0) return null;
            const r = routeRes.rows[0];

            // Fetch ordered stops from route_stops join table
            const stopsRes = await query(
                `SELECT s.id, s.name, s.latitude, s.longitude, s.priority, rs.sequence, rs.status as stop_status
                 FROM route_stops rs
                 JOIN stops s ON rs.stop_id = s.id
                 WHERE rs.route_id = $1
                 ORDER BY rs.sequence ASC`,
                [r.id]
            );

            const stops = stopsRes.rows.map(row => ({
                id: row.id,
                name: row.name,
                position: [row.latitude, row.longitude],
                priority: row.priority,
                status: row.stop_status,
                sequence: row.sequence
            }));

            return {
                id: r.id,
                depot: [r.depot_lat, r.depot_lng],
                stops,
                osrmRoute: [],
                osrmDistance: r.total_distance,
                benchmark: {
                    savingsPercent: r.savings_percent,
                    twoOptDistance: r.total_distance,
                    naiveDistance: r.naive_distance
                },
                publishedAt: r.published_at ? new Date(r.published_at).toLocaleString() : null
            };
        }

        return store.getPublishedRoute();
    },

    async publish({ depot, stops, osrmRoute = [], osrmDistance = 0, benchmark = null, createdBy = null }) {
        if (isDbConnected()) {
            const pool = getPool();
            const client = await pool.connect();
            try {
                await client.query("BEGIN");

                // 1. Ensure/Insert depot record
                const depotRes = await client.query(
                    `INSERT INTO depots (name, latitude, longitude, created_by)
                     VALUES ('Active Dispatch Depot', $1, $2, $3)
                     RETURNING id`,
                    [depot[0], depot[1], createdBy]
                );
                const depotId = depotRes.rows[0].id;

                // 2. Insert route record
                const naiveDist = benchmark?.naiveDistance || osrmDistance;
                const savingsPct = benchmark?.savingsPercent || 0;

                const routeRes = await client.query(
                    `INSERT INTO routes (depot_id, status, total_distance, naive_distance, savings_percent, created_by, published_at)
                     VALUES ($1, 'published', $2, $3, $4, $5, NOW())
                     RETURNING *`,
                    [depotId, osrmDistance, naiveDist, savingsPct, createdBy]
                );
                const routeId = routeRes.rows[0].id;

                // 3. Upsert stops and populate route_stops with explicit sequence
                for (let i = 0; i < stops.length; i++) {
                    const s = stops[i];
                    let stopId = s.id;

                    // If stop id is client timestamp or not in DB, insert it
                    const existingStop = await client.query("SELECT id FROM stops WHERE id = $1", [stopId]).catch(() => ({ rows: [] }));
                    if (existingStop.rows.length === 0) {
                        const insertStop = await client.query(
                            `INSERT INTO stops (name, latitude, longitude, priority, created_by)
                             VALUES ($1, $2, $3, $4, $5)
                             RETURNING id`,
                            [s.name, s.position[0], s.position[1], s.priority || 'standard', createdBy]
                        );
                        stopId = insertStop.rows[0].id;
                    }

                    // Insert into route_stops
                    await client.query(
                        `INSERT INTO route_stops (route_id, stop_id, sequence, status)
                         VALUES ($1, $2, $3, 'pending')
                         ON CONFLICT (route_id, stop_id) DO UPDATE SET sequence = EXCLUDED.sequence`,
                        [routeId, stopId, i + 1]
                    );
                }

                await client.query("COMMIT");

                const routePayload = {
                    id: routeId,
                    depot,
                    stops,
                    osrmRoute,
                    osrmDistance,
                    benchmark,
                    publishedAt: new Date().toLocaleString()
                };

                // Also update in-memory store for instantaneous socket emission
                store.setPublishedRoute(routePayload);
                return routePayload;
            } catch (err) {
                await client.query("ROLLBACK");
                throw err;
            } finally {
                client.release();
            }
        }

        const routePayload = {
            depot,
            stops,
            osrmRoute,
            osrmDistance,
            benchmark,
            publishedAt: new Date().toLocaleString()
        };
        store.setPublishedRoute(routePayload);
        return routePayload;
    }
};

export default routeRepository;
