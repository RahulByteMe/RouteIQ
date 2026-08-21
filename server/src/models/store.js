import { INITIAL_STOPS, INITIAL_DEPOT } from "../config/constants.js";

// ─── In-Memory Data Store ──────────────────────────────────────────────────
//
// Centralized state container for delivery stops, depot, published route,
// and real-time driver telemetry.
// ───────────────────────────────────────────────────────────────────────────

class MemoryStore {
    constructor() {
        this.stops = [...INITIAL_STOPS];
        this.depot = [...INITIAL_DEPOT];
        this.publishedRoute = null;
        this.driverTelemetry = {
            currentPosition: null,
            heading: 0,
            speed: 0,
            isLive: false,
            isSimulating: false,
            completedIds: [],
            lastUpdated: null
        };
    }

    // Stops
    getStops() {
        return this.stops;
    }

    addStop(stop) {
        this.stops.push(stop);
        return stop;
    }

    deleteStop(id) {
        this.stops = this.stops.filter((s) => s.id !== id);
        return id;
    }

    // Depot
    getDepot() {
        return this.depot;
    }

    setDepot(depot) {
        this.depot = depot;
        return this.depot;
    }

    // Published Route
    getPublishedRoute() {
        return this.publishedRoute;
    }

    setPublishedRoute(route) {
        this.publishedRoute = route;
        // Reset driver telemetry progress for the new route
        this.driverTelemetry.completedIds = [];
        this.driverTelemetry.currentPosition = null;
        return this.publishedRoute;
    }

    // Driver Telemetry
    getDriverTelemetry() {
        return this.driverTelemetry;
    }

    updateDriverLocation(telemetry) {
        this.driverTelemetry = {
            ...this.driverTelemetry,
            ...telemetry,
            lastUpdated: new Date().toISOString()
        };
        return this.driverTelemetry;
    }

    updateStopCompletion(stopId, isDone) {
        const idSet = new Set(this.driverTelemetry.completedIds);
        if (isDone) {
            idSet.add(stopId);
        } else {
            idSet.delete(stopId);
        }
        this.driverTelemetry.completedIds = Array.from(idSet);
        return this.driverTelemetry.completedIds;
    }

    updateDriverStatus(isLive, isSimulating) {
        this.driverTelemetry.isLive = isLive;
        this.driverTelemetry.isSimulating = isSimulating;
        return this.driverTelemetry;
    }
}

export const store = new MemoryStore();
export default store;
