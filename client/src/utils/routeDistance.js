import calculateDistance from "./distance";

// ─── calculateRouteDistance ─────────────────────────────────────────────────
//
// WHAT IT DOES:
//   Calculates the total travel distance for the full round-trip delivery route.
//
// THE ROUTE IT MEASURES:
//   Depot → Stop 1 → Stop 2 → ... → Last Stop → Depot
//
// HOW IT WORKS:
//   We "walk" the route the same way the driver would — starting at the depot,
//   moving to each stop in order, and finally returning to the depot.
//   At each leg, we add the Haversine distance between the two points.
//
// PARAMETERS:
//   depot           → [lat, lng] of the warehouse
//   optimizedStops  → array of stop objects in visit order (from optimizeRoute)
//
// RETURNS:
//   Total distance in kilometers (a number), rounded to 2 decimal places.
//   Returns 0 if there is no depot or no stops.
//
// EXAMPLE:
//   depot = [31.4685, 76.2708]
//   optimizedStops = [Stop A, Stop B, Stop C]
//
//   total = dist(depot → A) + dist(A → B) + dist(B → C) + dist(C → depot)
// ───────────────────────────────────────────────────────────────────────────

function calculateRouteDistance(depot, optimizedStops) {

    // Guard: if we have no depot or no stops, distance is 0
    if (!depot || optimizedStops.length === 0) {
        return 0;
    }

    let totalDistance = 0;
    let currentPosition = depot; // start from the depot

    // Walk through each stop in order
    for (const stop of optimizedStops) {
        // Add the distance from where we are to this stop
        totalDistance += calculateDistance(currentPosition, stop.position);
        // Move "current position" to this stop
        currentPosition = stop.position;
    }

    // Add the return leg: last stop back to depot
    totalDistance += calculateDistance(currentPosition, depot);

    // Round to 2 decimal places for clean display
    return Math.round(totalDistance * 100) / 100;
}

export default calculateRouteDistance;
