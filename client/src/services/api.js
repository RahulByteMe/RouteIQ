// ─── RouteIQ REST API Client (Backend Database Connection) ──────────────────
//
// WHAT IT DOES:
//   Connects directly to the RouteIQ backend API and PostgreSQL database
//   with automatic JWT bearer token injection and error handling.
// ───────────────────────────────────────────────────────────────────────────

const API_BASE = "http://127.0.0.1:4000/api";

function getHeaders() {
    const token = localStorage.getItem("routeiq_token");
    const headers = { "Content-Type": "application/json" };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

// ─── Stops API ─────────────────────────────────────────────────────────────
export async function fetchStops() {
    try {
        const res = await fetch(`${API_BASE}/stops`, {
            headers: getHeaders()
        });
        if (res.ok) {
            const data = await res.json();
            return data;
        }
    } catch (err) {
        console.warn("Error fetching stops from backend DB:", err);
    }
    return [];
}

export async function createStop(stop) {
    try {
        const res = await fetch(`${API_BASE}/stops`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(stop)
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (err) {
        console.warn("Error creating stop on backend DB:", err);
    }
    return stop;
}

export async function deleteStop(stopId) {
    try {
        const res = await fetch(`${API_BASE}/stops/${stopId}`, {
            method: "DELETE",
            headers: getHeaders()
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (err) {
        console.warn("Error deleting stop on backend DB:", err);
    }
    return { id: stopId };
}

export async function saveBatchStops(stops) {
    try {
        const res = await fetch(`${API_BASE}/stops/batch`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ stops })
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (err) {
        console.warn("Error saving batch stops to backend DB:", err);
    }
    return stops;
}

// ─── Depot API ─────────────────────────────────────────────────────────────
export async function fetchDepot() {
    try {
        const res = await fetch(`${API_BASE}/depot`, {
            headers: getHeaders()
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.depot) return data.depot;
        }
    } catch (err) {
        console.warn("Error fetching depot from backend DB:", err);
    }
    return [28.6139, 77.2090]; // Default New Delhi
}

export async function saveDepot(depot) {
    try {
        const res = await fetch(`${API_BASE}/depot`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ depot })
        });
        if (res.ok) {
            const data = await res.json();
            return data.depot;
        }
    } catch (err) {
        console.warn("Error saving depot to backend DB:", err);
    }
    return depot;
}

// ─── Routes API ────────────────────────────────────────────────────────────
export async function fetchPublishedRoute() {
    try {
        const res = await fetch(`${API_BASE}/routes/published`, {
            headers: getHeaders()
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.depot) return data;
        }
    } catch (err) {
        console.warn("Error fetching published route from backend DB:", err);
    }
    return null;
}

export async function publishRoute(payload) {
    try {
        const res = await fetch(`${API_BASE}/routes/publish`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            return await res.json();
        }
    } catch (err) {
        console.warn("Backend API sync failed:", err);
    }
    return payload;
}

export default {
    fetchStops,
    createStop,
    deleteStop,
    saveBatchStops,
    fetchDepot,
    saveDepot,
    fetchPublishedRoute,
    publishRoute
};
