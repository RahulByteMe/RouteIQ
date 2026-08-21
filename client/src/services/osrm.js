// ─── OSRM Service ──────────────────────────────────────────────────────────
//
// WHAT IT DOES:
//   Communicates with the free OSRM (Open Source Routing Machine) API to 
//   get actual driving paths hugging the roads, and real driving distances.
//
// API DOCUMENTATION:
//   http://project-osrm.org/docs/v5.24.0/api/#trip-service
//
// IMPORTANT DETAIL (Lat/Lng vs Lng/Lat):
//   - Leaflet (and our app) uses: [latitude, longitude] (Y, X)
//   - OSRM (and GeoJSON) uses:    [longitude, latitude] (X, Y)
//   We MUST flip the coordinates before sending them to OSRM, and flip them 
//   back when receiving the route data.
// ───────────────────────────────────────────────────────────────────────────

// (Keeping this for basic A-to-B routing if ever needed)
export async function getDrivingRoute(waypoints) {
    if (!waypoints || waypoints.length < 2) {
        return { routePositions: [], distance: 0 };
    }

    try {
        const coordsString = waypoints
            .map((point) => `${point[1]},${point[0]}`) // flip to [lng, lat]
            .join(";");

        const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`OSRM API error: ${response.status}`);
        const data = await response.json();

        if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
            return { routePositions: [], distance: 0 };
        }

        const route = data.routes[0];
        const geoJsonCoords = route.geometry.coordinates; 
        const leafletCoords = geoJsonCoords.map((coord) => [coord[1], coord[0]]);
        const distanceKm = route.distance / 1000;

        return {
            routePositions: leafletCoords,
            distance: Math.round(distanceKm * 100) / 100 
        };
    } catch (error) {
        console.error("Error fetching driving route:", error);
        return { routePositions: [], distance: 0 };
    }
}


// ─── OSRM Trip API (TSP Solver) ────────────────────────────────────────────
//
// This replaces our JS Haversine math!
// Instead of us sorting the stops and asking OSRM to connect them, we give
// OSRM the unordered stops and it solves the Travelling Salesman Problem 
// using REAL road driving distances (respecting rivers, bridges, highways).
//
// RETURNS:
//   { orderedStops, routePositions, distance }
// ───────────────────────────────────────────────────────────────────────────
export async function getOptimizedTrip(depot, stops) {
    if (!depot || stops.length === 0) {
        return { orderedStops: [], routePositions: [], distance: 0 };
    }

    try {
        // 1. Array of all coordinates. Depot MUST be index 0.
        const allPoints = [depot, ...stops.map(s => s.position)];

        // Format: lng,lat;lng,lat...
        const coordsString = allPoints
            .map(point => `${point[1]},${point[0]}`)
            .join(";");

        // 2. Build the Trip API URL
        // source=first -> Make the Depot the fixed start/end point.
        // roundtrip=true -> Return back to the depot at the end.
        const url = `https://router.project-osrm.org/trip/v1/driving/${coordsString}?source=first&roundtrip=true&overview=full&geometries=geojson`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(`OSRM Trip API error: ${response.status}`);
        
        const data = await response.json();
        
        if (data.code !== "Ok" || !data.trips || data.trips.length === 0) {
            console.warn("No trip found by OSRM");
            return { orderedStops: stops, routePositions: [], distance: 0 };
        }

        const trip = data.trips[0];
        const waypoints = data.waypoints;

        // 3. Sort our React stops based on OSRM's optimal road-based order.
        // The waypoints array maps 1-to-1 with our input `allPoints`.
        // waypoints[0] is the depot. waypoints[1] is stops[0], etc.
        // Each waypoint has a `waypoint_index` telling us its place in the final route.
        const mappedStops = stops.map((stop, index) => {
            const osrmWaypointData = waypoints[index + 1]; // +1 to skip the depot
            return {
                stop: stop,
                optimalIndex: osrmWaypointData.waypoint_index
            };
        });

        // Sort ascending based on the optimal index from OSRM
        mappedStops.sort((a, b) => a.optimalIndex - b.optimalIndex);
        
        // Extract just the stop objects in their new correct order
        const orderedStops = mappedStops.map(m => m.stop);

        // 4. Extract road geometry and distance
        const geoJsonCoords = trip.geometry.coordinates; 
        const leafletCoords = geoJsonCoords.map(coord => [coord[1], coord[0]]);
        const distanceKm = trip.distance / 1000;

        return {
            orderedStops,
            routePositions: leafletCoords,
            distance: Math.round(distanceKm * 100) / 100
        };

    } catch (error) {
        console.error("Error fetching optimized trip:", error);
        return { orderedStops: stops, routePositions: [], distance: 0 };
    }
}
