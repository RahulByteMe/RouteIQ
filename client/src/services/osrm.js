import calculateDistance from "../utils/distance";

// ─── OSRM Road-Network Routing & Distance Matrix Service ───────────────────
//
// WHAT IT DOES:
//   1. Fetches pairwise road distance/duration matrix (OSRM Table API)
//   2. Caches matrices in-memory to prevent rate-limiting public demo servers
//   3. Falls back gracefully to Haversine straight-line distance if offline
//   4. Fetches exact GeoJSON driving geometry for Leaflet map polylines
//
// NOTE: Leaflet uses [latitude, longitude], OSRM uses [longitude, latitude].
// ───────────────────────────────────────────────────────────────────────────

const OSRM_BASE_URL = "https://router.project-osrm.org";

// In-memory LRU-style caches
const matrixCache = new Map();
const routeCache = new Map();
const MAX_CACHE_SIZE = 100;

function setCache(cache, key, value) {
    if (cache.size >= MAX_CACHE_SIZE) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
    }
    cache.set(key, value);
}

function getCoordsKey(waypoints) {
    return waypoints
        .map((p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`)
        .join(";");
}

// ─── 1. Pairwise Distance & Duration Matrix API ────────────────────────────
export async function fetchDistanceMatrix(waypoints) {
    if (!waypoints || waypoints.length < 2) {
        return {
            distances: [[0]],
            durations: [[0]],
            source: "empty"
        };
    }

    const cacheKey = getCoordsKey(waypoints);
    if (matrixCache.has(cacheKey)) {
        return matrixCache.get(cacheKey);
    }

    try {
        // OSRM expects: lng,lat;lng,lat...
        const coordsString = waypoints
            .map((p) => `${p[1]},${p[0]}`)
            .join(";");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

        const url = `${OSRM_BASE_URL}/table/v1/driving/${coordsString}?annotations=distance,duration`;
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error(`OSRM Table API returned status: ${res.status}`);

        const data = await res.json();
        if (data.code !== "Ok" || !data.distances) {
            throw new Error(`OSRM Table API failed: ${data.code || "No distances"}`);
        }

        // Convert distances from meters to km, durations from seconds to minutes
        const distancesKm = data.distances.map((row) =>
            row.map((val) => (val !== null ? Math.round((val / 1000) * 100) / 100 : 99999))
        );
        const durationsMin = data.durations
            ? data.durations.map((row) =>
                  row.map((val) => (val !== null ? Math.round((val / 60) * 10) / 10 : 9999))
              )
            : null;

        const result = {
            distances: distancesKm,
            durations: durationsMin,
            source: "osrm_road_network"
        };

        setCache(matrixCache, cacheKey, result);
        return result;
    } catch (err) {
        console.warn("⚠️ OSRM Table API unavailable, using Haversine distance matrix fallback:", err.message);

        // Fallback: Build synthetic Haversine distance matrix
        const n = waypoints.length;
        const distances = Array.from({ length: n }, () => Array(n).fill(0));
        const durations = Array.from({ length: n }, () => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    distances[i][j] = 0;
                    durations[i][j] = 0;
                } else {
                    const distKm = calculateDistance(waypoints[i], waypoints[j]);
                    distances[i][j] = Math.round(distKm * 100) / 100;
                    // Estimate ~30 km/h urban speed -> 2 minutes per km
                    durations[i][j] = Math.round(distKm * 2 * 10) / 10;
                }
            }
        }

        const fallbackResult = {
            distances,
            durations,
            source: "haversine_fallback"
        };

        setCache(matrixCache, cacheKey, fallbackResult);
        return fallbackResult;
    }
}

// ─── 2. Driving Route Geometry API ─────────────────────────────────────────
export async function getDrivingRoute(waypoints) {
    if (!waypoints || waypoints.length < 2) {
        return { routePositions: [], distance: 0, duration: 0 };
    }

    const cacheKey = getCoordsKey(waypoints);
    if (routeCache.has(cacheKey)) {
        return routeCache.get(cacheKey);
    }

    try {
        const coordsString = waypoints
            .map((point) => `${point[1]},${point[0]}`)
            .join(";");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const url = `${OSRM_BASE_URL}/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`OSRM Route API error: ${response.status}`);
        const data = await response.json();

        if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
            return fallbackStraightLineRoute(waypoints);
        }

        const route = data.routes[0];
        const geoJsonCoords = route.geometry.coordinates;
        const leafletCoords = geoJsonCoords.map((coord) => [coord[1], coord[0]]);
        const distanceKm = Math.round((route.distance / 1000) * 100) / 100;
        const durationMin = Math.round((route.duration / 60) * 10) / 10;

        const result = {
            routePositions: leafletCoords,
            distance: distanceKm,
            duration: durationMin,
            source: "osrm"
        };

        setCache(routeCache, cacheKey, result);
        return result;
    } catch (error) {
        console.warn("⚠️ OSRM Route API failed, rendering straight-line polyline:", error.message);
        return fallbackStraightLineRoute(waypoints);
    }
}

function fallbackStraightLineRoute(waypoints) {
    let totalDist = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
        totalDist += calculateDistance(waypoints[i], waypoints[i + 1]);
    }
    return {
        routePositions: waypoints,
        distance: Math.round(totalDist * 100) / 100,
        duration: Math.round(totalDist * 2 * 10) / 10,
        source: "haversine_fallback"
    };
}

export default {
    fetchDistanceMatrix,
    getDrivingRoute
};
