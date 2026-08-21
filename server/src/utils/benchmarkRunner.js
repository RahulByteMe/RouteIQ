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

// ─── Self-Implemented Optimization Algorithms (Unchanged) ──────────────────
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

// ─── Deterministic Seeded Pseudo-Random Generator (Mulberry32) ─────────────
// Guaranteed 100% reproducible coordinates across all platforms and runs.
function createMulberry32(seed) {
    let s = seed | 0;
    return function () {
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function generateDeterministicDataset(size, depot = [28.6139, 77.2090], seed = 100) {
    const rng = createMulberry32(seed * 1000 + size);
    return Array.from({ length: size }, (_, i) => {
        const angle = rng() * Math.PI * 2;
        const radius = 0.015 + rng() * 0.085; // ~1.5km to ~9.5km radius
        return {
            id: i + 1,
            name: `Stop #${i + 1}`,
            position: [
                Math.round((depot[0] + radius * Math.sin(angle)) * 100000) / 100000,
                Math.round((depot[1] + radius * Math.cos(angle)) * 100000) / 100000
            ],
            priority: i % 5 === 0 ? "urgent" : "standard"
        };
    });
}

// ─── Comprehensive Multi-Dataset Multi-Iteration Benchmark ─────────────────
export function runReproducibleBenchmark({
    stopCounts = [5, 10, 20, 30, 50],
    datasetsPerStopCount = 10,
    timingIterations = 100,
    baseSeed = 1001,
    depot = [28.6139, 77.2090]
} = {}) {

    console.log("========================================================================================================================");
    console.log("🚀 ROUTEIQ MULTI-DATASET EMPIRICAL BENCHMARK SUITE");
    console.log("========================================================================================================================");
    console.log(`Configuration:`);
    console.log(`  • Stop Counts Tested      : [${stopCounts.join(", ")}]`);
    console.log(`  • Datasets per Stop Count : ${datasetsPerStopCount} distinct deterministic seeds (Seeds: ${baseSeed} .. ${baseSeed + datasetsPerStopCount - 1})`);
    console.log(`  • Timing Iterations       : ${timingIterations} runs per dataset with perf_hooks.performance.now()`);
    console.log(`  • Reduction Formula       : ((naiveDistance - twoOptDistance) / naiveDistance) * 100 [Positive = Distance Saved]`);
    console.log(`  • Heuristic Note          : Nearest-Neighbor is a greedy heuristic; 2-Opt local search untangles crossing edges.`);
    console.log("========================================================================================================================\n");

    const aggregatedSummary = [];
    const allDetailedRuns = [];

    // Warm-up V8 JIT compiler
    const warmupStops = generateDeterministicDataset(20, depot, 9999);
    for (let w = 0; w < 20; w++) {
        const r = nearestNeighbor(warmupStops, depot);
        twoOptWithSteps(r, depot);
    }

    for (const size of stopCounts) {
        console.log(`── Stop Count: ${size} (${datasetsPerStopCount} Datasets, ${timingIterations} Timing Iterations Each) ────────────────────────────────────────────────`);
        console.log(`Seed   | Naive (km) | NN (km)    | 2-Opt (km) | Reduction % | NN Time (ms) | 2-Opt Time (ms) | Total (ms) | Swaps`);
        console.log(`------------------------------------------------------------------------------------------------------------------------`);

        const sizeRuns = [];

        for (let d = 0; d < datasetsPerStopCount; d++) {
            const seed = baseSeed + d;
            const dataset = generateDeterministicDataset(size, depot, seed);
            const naiveDistance = calculateRouteDistance(depot, dataset);

            let totalNnTime = 0;
            let totalTwoOptTime = 0;
            let singleNnDistance = 0;
            let singleTwoOptDistance = 0;
            let singleSwaps = 0;

            for (let iter = 0; iter < timingIterations; iter++) {
                const t0 = performance.now();
                const nnRoute = nearestNeighbor(dataset, depot);
                const t1 = performance.now();
                const { bestDistance, swapCount } = twoOptWithSteps(nnRoute, depot);
                const t2 = performance.now();

                totalNnTime += (t1 - t0);
                totalTwoOptTime += (t2 - t1);

                if (iter === 0) {
                    singleNnDistance = calculateRouteDistance(depot, nnRoute);
                    singleTwoOptDistance = bestDistance;
                    singleSwaps = swapCount;
                }
            }

            const avgNnTime = totalNnTime / timingIterations;
            const avgTwoOptTime = totalTwoOptTime / timingIterations;
            const avgTotalTime = avgNnTime + avgTwoOptTime;

            // Positive reduction percentage means distance was reduced / saved:
            const reductionPct = naiveDistance > 0
                ? ((naiveDistance - singleTwoOptDistance) / naiveDistance) * 100
                : 0;

            const runData = {
                stopCount: size,
                seed,
                naiveKm: naiveDistance,
                nnKm: singleNnDistance,
                twoOptKm: singleTwoOptDistance,
                reductionPct,
                nnTimeMs: avgNnTime,
                twoOptTimeMs: avgTwoOptTime,
                totalTimeMs: avgTotalTime,
                swaps: singleSwaps
            };

            sizeRuns.push(runData);
            allDetailedRuns.push(runData);

            const pad = (val, len) => String(val).padEnd(len, " ");
            console.log(
                `${pad(seed, 6)} | ` +
                `${pad(runData.naiveKm.toFixed(2), 10)} | ` +
                `${pad(runData.nnKm.toFixed(2), 10)} | ` +
                `${pad(runData.twoOptKm.toFixed(2), 10)} | ` +
                `${pad(`+${runData.reductionPct.toFixed(1)}%`, 11)} | ` +
                `${pad(runData.nnTimeMs.toFixed(3), 12)} | ` +
                `${pad(runData.twoOptTimeMs.toFixed(3), 15)} | ` +
                `${pad(runData.totalTimeMs.toFixed(3), 10)} | ` +
                `${pad(runData.swaps, 5)}`
            );
        }

        // Aggregate statistics across the 10 datasets for this stop count
        const reductions = sizeRuns.map(r => r.reductionPct);
        const avgReduction = reductions.reduce((a, b) => a + b, 0) / reductions.length;
        const minReduction = Math.min(...reductions);
        const maxReduction = Math.max(...reductions);

        const avgNnTime = sizeRuns.reduce((a, b) => a + b.nnTimeMs, 0) / sizeRuns.length;
        const avgTwoOptTime = sizeRuns.reduce((a, b) => a + b.twoOptTimeMs, 0) / sizeRuns.length;
        const avgTotalTime = sizeRuns.reduce((a, b) => a + b.totalTimeMs, 0) / sizeRuns.length;
        const avgSwaps = Math.round(sizeRuns.reduce((a, b) => a + b.swaps, 0) / sizeRuns.length);

        const avgNaiveKm = sizeRuns.reduce((a, b) => a + b.naiveKm, 0) / sizeRuns.length;
        const avgNnKm = sizeRuns.reduce((a, b) => a + b.nnKm, 0) / sizeRuns.length;
        const avgTwoOptKm = sizeRuns.reduce((a, b) => a + b.twoOptKm, 0) / sizeRuns.length;

        const summaryRow = {
            stops: size,
            datasetCount: datasetsPerStopCount,
            timingIterations,
            avgNaiveKm: Math.round(avgNaiveKm * 100) / 100,
            avgNnKm: Math.round(avgNnKm * 100) / 100,
            avgTwoOptKm: Math.round(avgTwoOptKm * 100) / 100,
            avgReductionPct: Math.round(avgReduction * 10) / 10,
            minReductionPct: Math.round(minReduction * 10) / 10,
            maxReductionPct: Math.round(maxReduction * 10) / 10,
            avgNnTimeMs: Math.round(avgNnTime * 1000) / 1000,
            avgTwoOptTimeMs: Math.round(avgTwoOptTime * 1000) / 1000,
            avgTotalTimeMs: Math.round(avgTotalTime * 1000) / 1000,
            avgSwaps,
            passedPrd: avgReduction >= 15.0 && avgTotalTime < 2000.0
        };

        aggregatedSummary.push(summaryRow);
        console.log(`------------------------------------------------------------------------------------------------------------------------\n`);
    }

    // ── Print Aggregate Table ──
    console.log("========================================================================================================================");
    console.log("📊 AGGREGATE PERFORMANCE SUMMARY (Averaged across 10 Datasets × 100 Timing Iterations per Stop Count)");
    console.log("========================================================================================================================");
    console.log("Stops | Avg Naive | Avg NN   | Avg 2-Opt | Avg Reduc % | Min Reduc % | Max Reduc % | Avg NN (ms) | Avg 2-Opt (ms) | Total (ms) | PRD Valid");
    console.log("------------------------------------------------------------------------------------------------------------------------");

    const pad = (val, len) => String(val).padEnd(len, " ");
    for (const row of aggregatedSummary) {
        console.log(
            `${pad(row.stops, 5)} | ` +
            `${pad(`${row.avgNaiveKm.toFixed(2)} km`, 9)} | ` +
            `${pad(`${row.avgNnKm.toFixed(2)} km`, 8)} | ` +
            `${pad(`${row.avgTwoOptKm.toFixed(2)} km`, 9)} | ` +
            `${pad(`+${row.avgReductionPct.toFixed(1)}%`, 11)} | ` +
            `${pad(`+${row.minReductionPct.toFixed(1)}%`, 11)} | ` +
            `${pad(`+${row.maxReductionPct.toFixed(1)}%`, 11)} | ` +
            `${pad(row.avgNnTimeMs.toFixed(3), 11)} | ` +
            `${pad(row.avgTwoOptTimeMs.toFixed(3), 14)} | ` +
            `${pad(row.avgTotalTimeMs.toFixed(3), 10)} | ` +
            `${row.passedPrd ? "✅ PASS" : "❌ FAIL"}`
        );
    }

    console.log("========================================================================================================================");
    console.log("• Distance Reduction Formula: ((naiveDistance - twoOptDistance) / naiveDistance) * 100 [Positive = distance reduced]");
    console.log("• Time Measurement         : Node.js perf_hooks.performance.now() averaged across 100 timing runs per dataset");
    console.log("• Reproducibility          : Seeded Mulberry32 PRNG (Seeds 1001-1010) guarantees identical coordinates across runs");
    console.log("========================================================================================================================\n");

    return { aggregatedSummary, allDetailedRuns };
}

// If run directly via CLI
if (process.argv[1]?.endsWith("benchmarkRunner.js")) {
    runReproducibleBenchmark({
        stopCounts: [5, 10, 20, 30, 50],
        datasetsPerStopCount: 10,
        timingIterations: 100
    });
}
