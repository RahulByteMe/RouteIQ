// ─── RouteIQ REST API Client ───────────────────────────────────────────────
//
// WHAT IT DOES:
//   Connects to the RouteIQ backend API (http://127.0.0.1:4000) with JWT bearer
//   token attachment and graceful fallback to localStorage.
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

export async function fetchStops() {
    try {
        const res = await fetch(`${API_BASE}/stops`, {
            headers: getHeaders()
        });
        if (res.ok) return await res.json();
    } catch {
        // Fallback to localStorage
    }
    const saved = localStorage.getItem("dispatcher_stops");
    return saved ? JSON.parse(saved) : [];
}

export async function saveDepot(depot) {
    try {
        await fetch(`${API_BASE}/depot`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ depot })
        });
    } catch {
        // Fallback to localStorage
    }
    localStorage.setItem("dispatcher_depot", JSON.stringify(depot));
}

export async function fetchPublishedRoute() {
    try {
        const res = await fetch(`${API_BASE}/routes/published`, {
            headers: getHeaders()
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.depot) return data;
        }
    } catch {
        // Fallback to localStorage
    }
    const saved = localStorage.getItem("routeiq_published_route");
    return saved ? JSON.parse(saved) : null;
}

export async function publishRoute(payload) {
    localStorage.setItem("routeiq_published_route", JSON.stringify(payload));

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
        console.warn("Backend API sync failed, relying on local storage:", err);
    }
    return payload;
}
