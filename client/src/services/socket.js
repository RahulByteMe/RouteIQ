import { io } from "socket.io-client";

// ─── Socket.IO Client Singleton ────────────────────────────────────────────
//
// WHAT IT DOES:
//   Establishes a persistent bidirectional connection to the RouteIQ backend
//   for sub-second GPS location updates, real-time stop status sync, and
//   deviation notifications.
// ───────────────────────────────────────────────────────────────────────────

const SOCKET_SERVER_URL = "http://127.0.0.1:4000";

export const socket = io(SOCKET_SERVER_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000
});

socket.on("connect", () => {
    console.log("🟢 Connected to RouteIQ WebSocket Server:", socket.id);
});

socket.on("disconnect", () => {
    console.log("🔴 Disconnected from RouteIQ WebSocket Server");
});

export default socket;
