import calculateDistance from "./distance";
import calculateRouteDistance from "./routeDistance";
import { fetchDistanceMatrix, getDrivingRoute } from "../services/osrm";

// ─── Priority-Aware Nearest-Neighbor (Coordinate or Matrix Based) ───────────

export function nearestNeighbor(stops, depot, matrix = null) {
    const visited = new Set();
    const route = [];
    let currentIndex = 0; // Depot is index 0 in the combined waypoints array

    // Build stop-to-index mapping if matrix is provided
    // Index 0: Depot, Index 1..N: stops[0..N-1]
    const stopIndexMap = new Map();
    stops.forEach((s, idx) => stopIndexMap.set(s.id, idx + 1));

    let currentPosition = depot;

    while (visited.size < stops.length) {
        let nearestStop = null;
        let minDistance = Infinity;
        let nextIndex = 0;

        const unvisitedUrgent = stops.filter((s) => !visited.has(s.id) && s.priority === "urgent");
        const candidatePool = unvisitedUrgent.length > 0
            ? unvisitedUrgent
            : stops.filter((s) => !visited.has(s.id));

        for (const stop of candidatePool) {
            let distance;
            if (matrix && matrix.distances) {
                const targetIndex = stopIndexMap.get(stop.id);
                distance = matrix.distances[currentIndex][targetIndex];
            } else {
                distance = calculateDistance(currentPosition, stop.position);
            }

            if (distance < minDistance) {
                minDistance = distance;
                nearestStop = stop;
                nextIndex = stopIndexMap.get(stop.id);
            }
        }

        if (nearestStop) {
            visited.add(nearestStop.id);
            route.push(nearestStop);
            currentPosition = nearestStop.position;
            currentIndex = nextIndex;
        } else {
            break;
        }
    }

    return route;
}

// ─── Calculate Route Distance Using Matrix or Haversine ─────────────────────
function computeTourDistance(depot, stops, matrix = null, stopIndexMap = null) {
    if (!stops || stops.length === 0) return 0;
    if (!matrix || !matrix.distances || !stopIndexMap) {
        return calculateRouteDistance(depot, stops);
    }

    let total = 0;
    let prevIndex = 0; // Depot

    for (const stop of stops) {
        const currIndex = stopIndexMap.get(stop.id);
        total += matrix.distances[prevIndex][currIndex];
        prevIndex = currIndex;
    }
    // Return back to depot
    total += matrix.distances[prevIndex][0];
    return Math.round(total * 100) / 100;
}

// ─── 2-Opt Local Search Algorithm (Matrix / Haversine Compatible) ───────────
export function twoOptWithSteps(route, depot, matrix = null) {
    const stopIndexMap = new Map();
    route.forEach((s, idx) => stopIndexMap.set(s.id, idx + 1));

    let bestDistance = computeTourDistance(depot, route, matrix, stopIndexMap);

    if (route.length <= 2) {
        return {
            bestRoute: route,
            bestDistance,
            steps: [
                {
                    step: 0,
                    type: "initial",
                    route: [...route],
                    distance: bestDistance,
                    description: "Initial route (≤ 2 stops, no swaps needed)",
                    reversedIndices: null
                }
            ]
        };
    }

    let improved = true;
    let bestRoute = [...route];
    let stepCount = 0;

    const steps = [
        {
            step: 0,
            type: "initial",
            route: [...bestRoute],
            distance: bestDistance,
            description: "Initial Nearest-Neighbor Tour",
            reversedIndices: null
        }
    ];

    while (improved) {
        improved = false;

        for (let i = 0; i < bestRoute.length - 1; i++) {
            for (let k = i + 1; k < bestRoute.length; k++) {
                const newRoute = [
                    ...bestRoute.slice(0, i),
                    ...bestRoute.slice(i, k + 1).reverse(),
                    ...bestRoute.slice(k + 1)
                ];

                const newDistance = computeTourDistance(depot, newRoute, matrix, stopIndexMap);

                if (newDistance < bestDistance - 0.0001) {
                    const savedKm = Math.round((bestDistance - newDistance) * 100) / 100;
                    stepCount++;
                    bestDistance = newDistance;
                    bestRoute = newRoute;
                    improved = true;

                    steps.push({
                        step: stepCount,
                        type: "improvement",
                        route: [...bestRoute],
                        distance: bestDistance,
                        reversedIndices: [i, k],
                        description: `Step ${stepCount}: Untangled segment [${i + 1} ↔ ${k + 1}], saving ${savedKm} km`
                    });

                    break;
                }
            }
            if (improved) break;
        }
    }

    return {
        bestRoute,
        bestDistance,
        steps
    };
}

// ─── Synchronous Optimizer (for Synthetic Benchmarks & Fallbacks) ───────────
export function optimizeRouteWithBenchmark(stops, depot, matrix = null) {
    if (stops.length === 0 || !depot) {
        return {
            finalRoute: [],
            naiveRoute: [],
            naiveDistance: 0,
            nnRoute: [],
            nnDistance: 0,
            twoOptRoute: [],
            twoOptDistance: 0,
            savingsPercent: 0,
            nnSavingsPercent: 0,
            kmSaved: 0,
            co2SavedKg: 0,
            fuelSavedLiters: 0,
            costSavedUsd: 0,
            nnExecutionTimeMs: 0,
            twoOptExecutionTimeMs: 0,
            executionTimeMs: 0,
            swapCount: 0,
            steps: []
        };
    }

    const stopIndexMap = new Map();
    stops.forEach((s, idx) => stopIndexMap.set(s.id, idx + 1));

    // 1. Baseline: Naive Input Order
    const naiveRoute = [...stops];
    const naiveDistance = computeTourDistance(depot, naiveRoute, matrix, stopIndexMap);

    // 2. Greedy Phase: Nearest-Neighbor Construction (O(N^2))
    const nnStartTime = performance.now();
    const nnRoute = nearestNeighbor(stops, depot, matrix);
    const nnEndTime = performance.now();
    const nnExecutionTimeMs = Math.round((nnEndTime - nnStartTime) * 100) / 100;
    const nnDistance = computeTourDistance(depot, nnRoute, matrix, stopIndexMap);

    // 3. Improvement Phase: 2-Opt Local Search (O(N^3)) with Step Capture
    const twoOptStartTime = performance.now();
    const { bestRoute: twoOptRoute, bestDistance: twoOptDistance, steps } = twoOptWithSteps(nnRoute, depot, matrix);
    const twoOptEndTime = performance.now();
    const twoOptExecutionTimeMs = Math.round((twoOptEndTime - twoOptStartTime) * 100) / 100;

    const totalExecutionTimeMs = Math.round((nnExecutionTimeMs + twoOptExecutionTimeMs) * 100) / 100;

    const kmSaved = Math.max(0, Math.round((naiveDistance - twoOptDistance) * 100) / 100);
    const savingsPercent = naiveDistance > 0
        ? Math.max(0, Math.round(((naiveDistance - twoOptDistance) / naiveDistance) * 1000) / 10)
        : 0;

    const nnSavingsPercent = naiveDistance > 0
        ? Math.max(0, Math.round(((naiveDistance - nnDistance) / naiveDistance) * 1000) / 10)
        : 0;

    // Green Logistics / ESG Metrics:
    const co2SavedKg = Math.round(kmSaved * 0.21 * 100) / 100;
    const fuelSavedLiters = Math.round(kmSaved * 0.09 * 100) / 100;
    const costSavedUsd = Math.round(fuelSavedLiters * 1.45 * 100) / 100;

    return {
        finalRoute: twoOptRoute,
        naiveRoute,
        naiveDistance: Math.round(naiveDistance * 100) / 100,
        nnRoute,
        nnDistance: Math.round(nnDistance * 100) / 100,
        twoOptRoute,
        twoOptDistance: Math.round(twoOptDistance * 100) / 100,
        savingsPercent,
        nnSavingsPercent,
        kmSaved,
        co2SavedKg,
        fuelSavedLiters,
        costSavedUsd,
        nnExecutionTimeMs,
        twoOptExecutionTimeMs,
        executionTimeMs: totalExecutionTimeMs,
        swapCount: Math.max(0, steps.length - 1),
        steps
    };
}

// ─── Full Road-Network Optimizer (Async with Matrix & Geometry) ─────────────
export async function optimizeRouteWithRoadNetwork(stops, depot) {
    if (stops.length === 0 || !depot) {
        return {
            orderedStops: [],
            routePositions: [],
            distance: 0,
            duration: 0,
            benchmark: null,
            source: "empty"
        };
    }

    // 1. Fetch pairwise road distance/duration matrix (OSRM Table API with Cache & Fallback)
    const waypoints = [depot, ...stops.map((s) => s.position)];
    const matrixResult = await fetchDistanceMatrix(waypoints);

    // 2. Solve TSP using self-implemented Nearest-Neighbor + 2-Opt over the road matrix
    const benchmark = optimizeRouteWithBenchmark(stops, depot, matrixResult);
    const orderedStops = benchmark.finalRoute;

    // 3. Fetch exact GeoJSON driving polyline for the final sequenced route
    const orderedWaypoints = [depot, ...orderedStops.map((s) => s.position), depot];
    const drivingRoute = await getDrivingRoute(orderedWaypoints);

    return {
        orderedStops,
        routePositions: drivingRoute.routePositions,
        distance: drivingRoute.distance || benchmark.twoOptDistance,
        duration: drivingRoute.duration || Math.round((drivingRoute.distance || benchmark.twoOptDistance) * 2),
        benchmark: {
            ...benchmark,
            routingSource: matrixResult.source
        },
        source: matrixResult.source
    };
}

// ─── Default Export ────────────────────────────────────────────────────────
function optimizeRoute(stops, depot) {
    const result = optimizeRouteWithBenchmark(stops, depot);
    return result.finalRoute;
}

export default optimizeRoute;