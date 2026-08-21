import { store } from "../models/store.js";

// ─── Real-Time WebSocket Event Handler ─────────────────────────────────────
//
// Manages bidirectional telemetry events between Drivers and Dispatchers.
// ───────────────────────────────────────────────────────────────────────────

export const registerSocketHandlers = (io) => {
    io.on("connection", (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Sync initial state on new client connection
        const publishedRoute = store.getPublishedRoute();
        const telemetry = store.getDriverTelemetry();

        if (publishedRoute) {
            socket.emit("dispatcher:route_published", publishedRoute);
        }
        if (telemetry.currentPosition) {
            socket.emit("dispatcher:driver_moved", telemetry);
        }

        // 1. Driver emits GPS coordinates, heading, and speed
        socket.on("driver:location_update", (data) => {
            const updated = store.updateDriverLocation(data);
            io.emit("dispatcher:driver_moved", updated);
        });

        // 2. Driver updates stop completion status
        socket.on("driver:stop_completed", ({ stopId, isDone }) => {
            const completedIds = store.updateStopCompletion(stopId, isDone);
            io.emit("dispatcher:stop_updated", {
                stopId,
                isDone,
                completedIds
            });
        });

        // 3. Driver toggles simulation / live GPS status
        socket.on("driver:status_toggle", ({ isLive, isSimulating }) => {
            store.updateDriverStatus(isLive, isSimulating);
            io.emit("dispatcher:driver_status", {
                isLive,
                isSimulating
            });
        });

        socket.on("disconnect", () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });
};

export default registerSocketHandlers;
