import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DATABASE_URL } from "../config/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── PostgreSQL Connection Pool ────────────────────────────────────────────
//
// Manages database connection pool, automatic schema migration, and fallback
// detection when DATABASE_URL is configured.
// ───────────────────────────────────────────────────────────────────────────

const { Pool } = pg;

let pool = null;
let isConnected = false;

if (DATABASE_URL) {
    pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
        console.error("⚠️ Unexpected PostgreSQL pool error:", err.message);
    });
}

export async function initDb() {
    if (!pool) {
        console.log("ℹ️ No DATABASE_URL configured. Running with in-memory data store.");
        isConnected = false;
        return false;
    }

    try {
        const client = await pool.connect();
        try {
            const schemaPath = path.join(__dirname, "schema.sql");
            const schemaSql = fs.readFileSync(schemaPath, "utf-8");
            await client.query(schemaSql);
            isConnected = true;
            console.log("🐘 PostgreSQL connected & schema verified successfully.");
            return true;
        } finally {
            client.release();
        }
    } catch (err) {
        console.warn(`⚠️ Could not connect to PostgreSQL (${err.message}). Falling back to in-memory store.`);
        isConnected = false;
        return false;
    }
}

export async function query(text, params) {
    if (!pool || !isConnected) {
        throw new Error("PostgreSQL is not connected.");
    }
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG_SQL) {
        console.log("executed query", { text, duration, rows: res.rowCount });
    }
    return res;
}

export function isDbConnected() {
    return isConnected;
}

export function getPool() {
    return pool;
}

export default {
    query,
    initDb,
    isDbConnected,
    getPool,
};
