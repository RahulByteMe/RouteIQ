import { optimizeRouteWithBenchmark } from "./optimizeRoute";

// ─── Deterministic Pseudo-Random Generator (Linear Congruential Generator) ──
function createSeededRandom(seed = 42) {
    let s = seed;
    return function () {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
    };
}

function generateDeterministicStops(size, depot = [40.7580, -73.9855], seed = 12345) {
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

// ─── Automated Reproducible Algorithm Benchmark Suite ───────────────────────
//
// WHAT IT DOES:
//   Executes standard test clusters (5, 10, 20, 30, 50 stops) over multiple
//   iterations using performance.now() to measure exact execution times,
//   Nearest-Neighbor baseline, and 2-Opt local search distance reduction.
// ───────────────────────────────────────────────────────────────────────────

export function runBenchmarkSuite(iterations = 20) {
    const depot = [40.7580, -73.9855]; // Manhattan Central Hub
    const testBatchSizes = [5, 10, 20, 30, 50];

    const results = testBatchSizes.map((size) => {
        const stops = generateDeterministicStops(size, depot);

        // Warm-up
        for (let w = 0; w < 5; w++) {
            optimizeRouteWithBenchmark(stops, depot);
        }

        let totalNnTime = 0;
        let totalTwoOptTime = 0;
        let finalBenchmark = null;

        for (let iter = 0; iter < iterations; iter++) {
            const bench = optimizeRouteWithBenchmark(stops, depot);
            totalNnTime += bench.nnExecutionTimeMs;
            totalTwoOptTime += bench.twoOptExecutionTimeMs;
            if (iter === 0) {
                finalBenchmark = bench;
            }
        }

        const avgNnTime = Math.round((totalNnTime / iterations) * 1000) / 1000;
        const avgTwoOptTime = Math.round((totalTwoOptTime / iterations) * 1000) / 1000;
        const avgTotalTime = Math.round((avgNnTime + avgTwoOptTime) * 1000) / 1000;

        return {
            stopCount: size,
            naiveDistanceKm: finalBenchmark.naiveDistance,
            nnDistanceKm: finalBenchmark.nnDistance,
            twoOptDistanceKm: finalBenchmark.twoOptDistance,
            savingsPercent: finalBenchmark.savingsPercent,
            nnSavingsPercent: finalBenchmark.nnSavingsPercent,
            nnExecutionTimeMs: avgNnTime,
            twoOptExecutionTimeMs: avgTwoOptTime,
            executionTimeMs: avgTotalTime,
            swapCount: finalBenchmark.swapCount,
            co2SavedKg: finalBenchmark.co2SavedKg,
            fuelSavedLiters: finalBenchmark.fuelSavedLiters,
            passedPrdTarget: finalBenchmark.savingsPercent >= 15 && avgTotalTime < 2000
        };
    });

    return results;
}

export default runBenchmarkSuite;
