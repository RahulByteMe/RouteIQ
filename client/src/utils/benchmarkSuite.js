import { optimizeRouteWithBenchmark } from "./optimizeRoute";

// ─── Deterministic Pseudo-Random Generator (Mulberry32) ───────────────────
function createMulberry32(seed) {
    let s = seed | 0;
    return function () {
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function generateDeterministicStops(size, depot = [28.6139, 77.2090], seed = 1001) {
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

// ─── Automated Multi-Dataset Benchmark Suite for Frontend ──────────────────
export function runBenchmarkSuite(iterations = 20, datasetsPerSize = 5) {
    const depot = [28.6139, 77.2090]; // Delhi NCR Logistics Hub
    const testBatchSizes = [5, 10, 20, 30, 50];

    const results = testBatchSizes.map((size) => {
        let cumulativeNaiveDist = 0;
        let cumulativeNnDist = 0;
        let cumulativeTwoOptDist = 0;
        let cumulativeNnTime = 0;
        let cumulativeTwoOptTime = 0;
        let cumulativeSwaps = 0;
        let lastBench = null;

        for (let d = 0; d < datasetsPerSize; d++) {
            const seed = 1001 + d;
            const stops = generateDeterministicStops(size, depot, seed);

            for (let iter = 0; iter < iterations; iter++) {
                const bench = optimizeRouteWithBenchmark(stops, depot);
                cumulativeNnTime += bench.nnExecutionTimeMs;
                cumulativeTwoOptTime += bench.twoOptExecutionTimeMs;
                if (iter === 0) {
                    cumulativeNaiveDist += bench.naiveDistance;
                    cumulativeNnDist += bench.nnDistance;
                    cumulativeTwoOptDist += bench.twoOptDistance;
                    cumulativeSwaps += bench.swapCount;
                    lastBench = bench;
                }
            }
        }

        const totalRuns = datasetsPerSize * iterations;
        const avgNnTime = Math.round((cumulativeNnTime / totalRuns) * 1000) / 1000;
        const avgTwoOptTime = Math.round((cumulativeTwoOptTime / totalRuns) * 1000) / 1000;
        const avgTotalTime = Math.round((avgNnTime + avgTwoOptTime) * 1000) / 1000;

        const avgNaiveDist = Math.round((cumulativeNaiveDist / datasetsPerSize) * 100) / 100;
        const avgNnDist = Math.round((cumulativeNnDist / datasetsPerSize) * 100) / 100;
        const avgTwoOptDist = Math.round((cumulativeTwoOptDist / datasetsPerSize) * 100) / 100;
        const avgSwaps = Math.round(cumulativeSwaps / datasetsPerSize);

        // Distance reduction percentage (Positive means distance was saved):
        const savingsPercent = avgNaiveDist > 0
            ? Math.round(((avgNaiveDist - avgTwoOptDist) / avgNaiveDist) * 1000) / 10
            : 0;

        return {
            stopCount: size,
            naiveDistanceKm: avgNaiveDist,
            nnDistanceKm: avgNnDist,
            twoOptDistanceKm: avgTwoOptDist,
            savingsPercent,
            nnExecutionTimeMs: avgNnTime,
            twoOptExecutionTimeMs: avgTwoOptTime,
            executionTimeMs: avgTotalTime,
            swapCount: avgSwaps,
            co2SavedKg: lastBench ? lastBench.co2SavedKg : 0,
            fuelSavedLiters: lastBench ? lastBench.fuelSavedLiters : 0,
            passedPrdTarget: savingsPercent >= 15.0 && avgTotalTime < 2000.0
        };
    });

    return results;
}

export default runBenchmarkSuite;
