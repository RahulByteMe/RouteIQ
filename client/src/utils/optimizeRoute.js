import calculateDistance from "./distance";
import calculateRouteDistance from "./routeDistance";

// ─── Priority-Aware Nearest-Neighbor Algorithm ──────────────────────────────
//
// WHAT IT IS:
//   A greedy TSP construction heuristic that sequences urgent stops first,
//   then greedy nearest-neighbor for standard/flexible stops.
//
// TIME COMPLEXITY:
//   O(N^2) — at each step, scans all unvisited candidate stops to find the closest.
// ───────────────────────────────────────────────────────────────────────────

export function nearestNeighbor(stops, depot) {
    const visited = new Set();
    const route = [];

    let currentPosition = depot;

    while (visited.size < stops.length) {
        let nearestStop = null;
        let minDistance = Infinity;

        // Check if there are any unvisited URGENT stops
        const unvisitedUrgent = stops.filter((s) => !visited.has(s.id) && s.priority === "urgent");
        const candidatePool = unvisitedUrgent.length > 0
            ? unvisitedUrgent
            : stops.filter((s) => !visited.has(s.id));

        for (const stop of candidatePool) {
            const distance = calculateDistance(currentPosition, stop.position);

            if (distance < minDistance) {
                minDistance = distance;
                nearestStop = stop;
            }
        }

        if (nearestStop) {
            visited.add(nearestStop.id);
            route.push(nearestStop);
            currentPosition = nearestStop.position;
        } else {
            break;
        }
    }

    return route;
}

// ─── 2-Opt Algorithm with Step Tracking ────────────────────────────────────
//
// WHAT IT IS:
//   Systematic local search that tests 2-edge reversals to untangle crosses.
//
// TIME COMPLEXITY:
//   O(N^2) pairs per iteration, segment reversal takes O(N).
//   Typically runs O(N^3) total operations until convergence to a local minimum.
// ───────────────────────────────────────────────────────────────────────────

export function twoOptWithSteps(route, depot) {
    if (route.length <= 2) {
        const dist = calculateRouteDistance(depot, route);
        return {
            bestRoute: route,
            bestDistance: dist,
            steps: [
                {
                    step: 0,
                    type: "initial",
                    route: [...route],
                    distance: dist,
                    description: "Initial route (≤ 2 stops, no swaps needed)",
                    reversedIndices: null,
                }
            ]
        };
    }

    let improved = true;
    let bestRoute = [...route];
    let bestDistance = calculateRouteDistance(depot, bestRoute);
    let stepCount = 0;

    const steps = [
        {
            step: 0,
            type: "initial",
            route: [...bestRoute],
            distance: bestDistance,
            description: "Initial Nearest-Neighbor Tour",
            reversedIndices: null,
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

                const newDistance = calculateRouteDistance(depot, newRoute);

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
                        description: `Step ${stepCount}: Untangled segment [${i + 1} ↔ ${k + 1}], saving ${savedKm} km`,
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

// ─── Optimize Route with Benchmark & Timing Breakdown ──────────────────────
export function optimizeRouteWithBenchmark(stops, depot) {
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

    // 1. Baseline: Naive Input Order
    const naiveRoute = [...stops];
    const naiveDistance = calculateRouteDistance(depot, naiveRoute);

    // 2. Greedy Phase: Nearest-Neighbor Construction (O(N^2))
    const nnStartTime = performance.now();
    const nnRoute = nearestNeighbor(stops, depot);
    const nnEndTime = performance.now();
    const nnExecutionTimeMs = Math.round((nnEndTime - nnStartTime) * 100) / 100;
    const nnDistance = calculateRouteDistance(depot, nnRoute);

    // 3. Improvement Phase: 2-Opt Local Search (O(N^3)) with Step Capture
    const twoOptStartTime = performance.now();
    const { bestRoute: twoOptRoute, bestDistance: twoOptDistance, steps } = twoOptWithSteps(nnRoute, depot);
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
    // Average diesel delivery van emits ~0.21 kg CO2/km and burns ~0.09 L/km
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

// ─── Default Export ────────────────────────────────────────────────────────
function optimizeRoute(stops, depot) {
    const result = optimizeRouteWithBenchmark(stops, depot);
    return result.finalRoute;
}

export default optimizeRoute;