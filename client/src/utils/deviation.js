import calculateDistance from "./distance";

// ─── Route Deviation Utility ───────────────────────────────────────────────
//
// WHAT IT DOES:
//   Calculates the minimum perpendicular cross-track distance between a
//   driver's live GPS point P and every line segment of the planned route polyline.
//
// PRD ALIGNMENT:
//   - Section 6 / Phase 4: Route deviation detection (> 500m off-route threshold).
// ───────────────────────────────────────────────────────────────────────────

/**
 * Calculates the shortest distance in kilometers from a point P to a line segment AB.
 */
function pointToSegmentDistanceKm(p, a, b) {
    const latP = p[0], lngP = p[1];
    const latA = a[0], lngA = a[1];
    const latB = b[0], lngB = b[1];

    const dx = latB - latA;
    const dy = lngB - lngA;

    // Degenerate segment: A and B are the same point
    if (dx === 0 && dy === 0) {
        return calculateDistance(p, a);
    }

    // Projection parameter t of point P onto line AB: t = ((P - A) • (B - A)) / |B - A|²
    const t = Math.max(0, Math.min(1, ((latP - latA) * dx + (lngP - lngA) * dy) / (dx * dx + dy * dy)));

    // Nearest point on segment AB
    const nearestPoint = [
        latA + t * dx,
        lngA + t * dy
    ];

    return calculateDistance(p, nearestPoint);
}

/**
 * Calculates the minimum distance in meters between driverPosition and the route polyline.
 * Returns { isDeviated: boolean, distanceMeters: number, minDistanceKm: number }
 */
export function checkRouteDeviation(driverPosition, routePositions, thresholdMeters = 500) {
    if (!driverPosition || !routePositions || routePositions.length < 2) {
        return { isDeviated: false, distanceMeters: 0, minDistanceKm: 0 };
    }

    let minDistanceKm = Infinity;

    for (let i = 0; i < routePositions.length - 1; i++) {
        const segStart = routePositions[i];
        const segEnd = routePositions[i + 1];

        const distKm = pointToSegmentDistanceKm(driverPosition, segStart, segEnd);
        if (distKm < minDistanceKm) {
            minDistanceKm = distKm;
        }
    }

    const distanceMeters = Math.round(minDistanceKm * 1000);
    const isDeviated = distanceMeters > thresholdMeters;

    return {
        isDeviated,
        distanceMeters,
        minDistanceKm: Math.round(minDistanceKm * 100) / 100
    };
}

export default checkRouteDeviation;
