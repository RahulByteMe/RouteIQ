import http from "http";
import { Server } from "socket.io";
import { PORT, CORS_CONFIG } from "./src/config/constants.js";
import { createApp } from "./src/app.js";
import { registerSocketHandlers } from "./src/sockets/socketHandler.js";
import { initDb } from "./src/db/connection.js";

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

export { server, io };
