import http from "http";
import { Server } from "socket.io";
import { PORT, CORS_CONFIG } from "./src/config/constants.js";
import { createApp } from "./src/app.js";
import { registerSocketHandlers } from "./src/sockets/socketHandler.js";
import { initDb, getPool } from "./src/db/connection.js";

// ─── Server Bootstrap ──────────────────────────────────────────────────────
//
// Clean entry point: initializes database connection pool, binds HTTP server,
// Socket.IO instance, and registers modular controllers and WebSocket listeners.
// ───────────────────────────────────────────────────────────────────────────

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, { cors: CORS_CONFIG });

// Attach Socket.IO instance to app for controller access
app.set("io", io);

// Register WebSocket Listeners
registerSocketHandlers(io);

// Initialize DB and Start Server
async function startServer() {
    await initDb();

    server.listen(PORT, () => {
        console.log(`🚀 RouteIQ Server listening on http://127.0.0.1:${PORT}`);
    });
}

startServer();

// Graceful Shutdown Handler
function gracefulShutdown(signal) {
    console.log(`\n🛑 Received ${signal}. Shutting down RouteIQ server gracefully...`);
    io.close(() => {
        console.log("🔌 Closed all WebSocket connections.");
    });

    server.close(async () => {
        console.log("HTTP server closed.");
        const pool = getPool();
        if (pool) {
            await pool.end();
            console.log("🐘 Closed PostgreSQL connection pool.");
        }
        process.exit(0);
    });

    // Force exit if shutdown hangs beyond 5s
    setTimeout(() => {
        console.error("⚠️ Forcefully terminating after timeout.");
        process.exit(1);
    }, 5000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export { server, io };
