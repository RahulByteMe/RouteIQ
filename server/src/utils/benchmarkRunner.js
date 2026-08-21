import { performance } from "perf_hooks";

// ─── Mathematical Geodesic Distance (Haversine Formula) ────────────────────
function calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2) return 0;
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;

    const R = 6371; // Earth's mean radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function calculateRouteDistance(depot, stops) {
    if (!depot || !stops || stops.length === 0) return 0;
    let total = 0;
    let current = depot;

    for (const stop of stops) {
        total += calculateDistance(current, stop.position);
        current = stop.position;
    }
    // Return back to depot
    total += calculateDistance(current, depot);
    return total;
}

function nearestNeighbor(stops, depot) {
    const visited = new Set();
    const route = [];
    let currentPosition = depot;

    while (visited.size < stops.length) {
        let nearestStop = null;
        let minDistance = Infinity;

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

function twoOptWithSteps(route, depot) {
    if (route.length <= 2) {
        return { bestRoute: route, bestDistance: calculateRouteDistance(depot, route), swapCount: 0 };
    }

    let improved = true;
    let bestRoute = [...route];
    let bestDistance = calculateRouteDistance(depot, bestRoute);
    let swapCount = 0;

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
                    swapCount++;
                    bestDistance = newDistance;
                    bestRoute = newRoute;
                    improved = true;
                    break;
                }
            }
            if (improved) break;
        }
    }

    return { bestRoute, bestDistance, swapCount };
}

// Deterministic Pseudo-Random Generator (Linear Congruential Generator) for reproducible datasets
function createSeededRandom(seed = 42) {
    let s = seed;
    return function () {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
    };
}

function generateDeterministicDataset(size, depot = [40.7580, -73.9855], seed = 12345) {
    const rng = createSeededRandom(seed + size);
    return Array.from({ length: size }, (_, i) => {
        const angle = rng() * Math.PI * 2;
        const radius = 0.015 + rng() * 0.075; // ~1.5km to ~8.5km radius
        return {
            id: i + 1,
            name: `Stop #${i + 1}`,
            position: [
                Math.round((depot[0] + radius * Math.sin(angle)) * 10000) / 10000,
                Math.round((depot[1] + radius * Math.cos(angle)) * 10000) / 10000
            ],
            priority: i % 7 === 0 ? "urgent" : "standard"
        };
    });
}

// ─── Main Benchmark Runner ──────────────────────────────────────────────────
export function runReproducibleBenchmark(iterations = 100) {
    const depot = [40.7580, -73.9855]; // NYC Hub
    const testSizes = [5, 10, 20, 30, 50];

    console.log("=================================================================================================");
    console.log(`🚀 ROUTEIQ ALGORITHM EMPIRICAL BENCHMARK (Multi-Iteration Average: ${iterations} runs)`);
    console.log("=================================================================================================");
    console.log("Stops | Naive (km) | NN (km) | 2-Opt (km) | Reduction % | NN Time (ms) | 2-Opt Time (ms) | Total (ms) | Swaps | PRD Valid");
    console.log("-------------------------------------------------------------------------------------------------");

    const benchmarkResults = [];

    for (const size of testSizes) {
        const dataset = generateDeterministicDataset(size, depot);
        const naiveDistance = calculateRouteDistance(depot, dataset);

        // Warm-up JIT
        for (let w = 0; w < 10; w++) {
            const wNn = nearestNeighbor(dataset, depot);
            twoOptWithSteps(wNn, depot);
        }

        let totalNnTime = 0;
        let totalTwoOptTime = 0;
        let finalNnDistance = 0;
        let finalTwoOptDistance = 0;
        let finalSwaps = 0;

        for (let iter = 0; iter < iterations; iter++) {
            const t0 = performance.now();
            const nnRoute = nearestNeighbor(dataset, depot);
            const t1 = performance.now();
            const { bestDistance, swapCount } = twoOptWithSteps(nnRoute, depot);
            const t2 = performance.now();

            totalNnTime += (t1 - t0);
            totalTwoOptTime += (t2 - t1);

            if (iter === 0) {
                finalNnDistance = calculateRouteDistance(depot, nnRoute);
                finalTwoOptDistance = bestDistance;
                finalSwaps = swapCount;
            }
        }

        const avgNnTime = Math.round((totalNnTime / iterations) * 1000) / 1000;
        const avgTwoOptTime = Math.round((totalTwoOptTime / iterations) * 1000) / 1000;
        const avgTotalTime = Math.round((avgNnTime + avgTwoOptTime) * 1000) / 1000;

        const distanceReduction = naiveDistance > 0
            ? Math.round(((naiveDistance - finalTwoOptDistance) / naiveDistance) * 1000) / 10
            : 0;

        const passedPrd = distanceReduction >= 15.0 && avgTotalTime < 2000.0;

        const row = {
            stops: size,
            naiveKm: Math.round(naiveDistance * 100) / 100,
            nnKm: Math.round(finalNnDistance * 100) / 100,
            twoOptKm: Math.round(finalTwoOptDistance * 100) / 100,
            reductionPct: distanceReduction,
            nnTimeMs: avgNnTime,
            twoOptTimeMs: avgTwoOptTime,
            totalTimeMs: avgTotalTime,
            swaps: finalSwaps,
            passedPrd
        };

        benchmarkResults.push(row);

        const pad = (val, len) => String(val).padEnd(len, " ");
        console.log(
            `${pad(row.stops, 5)} | ` +
            `${pad(row.naiveKm.toFixed(2), 10)} | ` +
            `${pad(row.nnKm.toFixed(2), 7)} | ` +
            `${pad(row.twoOptKm.toFixed(2), 10)} | ` +
            `${pad(`-${row.reductionPct}%`, 11)} | ` +
            `${pad(row.nnTimeMs.toFixed(3), 12)} | ` +
            `${pad(row.twoOptTimeMs.toFixed(3), 15)} | ` +
            `${pad(row.totalTimeMs.toFixed(3), 10)} | ` +
            `${pad(row.swaps, 5)} | ` +
            `${row.passedPrd ? "✅ PASS" : "❌ FAIL"}`
        );
    }

    console.log("=================================================================================================");
    console.log("Formula: distanceReduction = ((naiveDistance - twoOptDistance) / naiveDistance) * 100");
    console.log("Timer: Node.js perf_hooks.performance.now() averaged across 100 iterations per batch.");
    console.log("=================================================================================================\n");

    return benchmarkResults;
}

// If run directly via CLI
if (process.argv[1]?.endsWith("benchmarkRunner.js")) {
    runReproducibleBenchmark(100);
}
