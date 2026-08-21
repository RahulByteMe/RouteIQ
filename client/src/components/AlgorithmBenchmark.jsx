// ─── AlgorithmBenchmark Component ──────────────────────────────────────────
//
// WHAT IT DOES:
//   Displays a live, transparent audit of the self-implemented algorithms
//   (Nearest-Neighbor Construction + 2-Opt Local Search) against a naive
//   un-optimized baseline.
//
// PRD ALIGNMENT:
//   - Demonstrates original algorithmic engineering (Section 2.2, 5.1, 5.2).
//   - Validates performance targets (≥ 15-25% reduction, < 2000ms latency).
// ───────────────────────────────────────────────────────────────────────────

function AlgorithmBenchmark({ benchmarkData, onOpenVisualizer }) {
    if (!benchmarkData || !benchmarkData.naiveDistance) {
        return null;
    }

    const {
        naiveDistance,
        nnDistance,
        twoOptDistance,
        savingsPercent,
        executionTimeMs,
        steps = []
    } = benchmarkData;

    // Calculate relative width percentages for the comparison bars (relative to naive baseline)
    const naivePct = 100;
    const nnPct = naiveDistance > 0 ? Math.round((nnDistance / naiveDistance) * 100) : 100;
    const twoOptPct = naiveDistance > 0 ? Math.round((twoOptDistance / naiveDistance) * 100) : 100;

    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-4 shadow-lg border border-gray-700 space-y-4">
            
            {/* Header / Metric Badge */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xs uppercase tracking-wider font-semibold text-blue-400">
                        ⚡ Algorithm Benchmark
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                        NN + 2-Opt vs. Naive Order
                    </p>
                </div>

                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    📉 -{savingsPercent}% km
                </span>
            </div>

            {/* Comparison Bars */}
            <div className="space-y-2.5 text-xs">
                
                {/* 1. Naive Baseline */}
                <div>
                    <div className="flex justify-between text-gray-400 mb-1 font-mono text-[11px]">
                        <span>1. Naive Input</span>
                        <span>{naiveDistance} km</span>
                    </div>
                    <div className="w-full bg-gray-700/60 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${naivePct}%` }}
                        />
                    </div>
                </div>

                {/* 2. Nearest Neighbor */}
                <div>
                    <div className="flex justify-between text-gray-300 mb-1 font-mono text-[11px]">
                        <span className="flex items-center gap-1">
                            <span>2. Nearest-Neighbor</span>
                            <span className="text-[10px] text-gray-500">O(N²)</span>
                        </span>
                        <span>{nnDistance} km</span>
                    </div>
                    <div className="w-full bg-gray-700/60 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${nnPct}%` }}
                        />
                    </div>
                </div>

                {/* 3. 2-Opt Local Search */}
                <div>
                    <div className="flex justify-between text-blue-300 font-semibold mb-1 font-mono text-[11px]">
                        <span className="flex items-center gap-1">
                            <span>3. 2-Opt Untangled</span>
                            <span className="text-[10px] text-blue-400">O(N³)</span>
                        </span>
                        <span className="text-emerald-400">{twoOptDistance} km</span>
                    </div>
                    <div className="w-full bg-gray-700/60 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-emerald-400 h-2 rounded-full transition-all duration-500 shadow-sm shadow-emerald-500/50"
                            style={{ width: `${twoOptPct}%` }}
                        />
                    </div>
                </div>

            </div>

            {/* Green Logistics & ESG Eco-Impact */}
            {benchmarkData.kmSaved > 0 && (
                <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
                        <span className="flex items-center gap-1">
                            <span>🌱</span>
                            <span>ESG Eco-Savings:</span>
                        </span>
                        <span className="font-mono font-bold">-{benchmarkData.kmSaved} km cut</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-300 font-mono">
                        <div>
                            <span className="text-gray-400">CO₂ Avoided: </span>
                            <strong className="text-emerald-300">~{benchmarkData.co2SavedKg || 0} kg</strong>
                        </div>
                        <div>
                            <span className="text-gray-400">Fuel Saved: </span>
                            <strong className="text-emerald-300">~{benchmarkData.fuelSavedLiters || 0} L</strong>
                        </div>
                    </div>
                </div>
            )}

            {/* Performance Footer */}
            <div className="pt-2 border-t border-gray-700/80 flex items-center justify-between text-[11px] text-gray-400">
                <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Solved in <strong className="text-gray-200 font-mono">{executionTimeMs} ms</strong></span>
                </div>
                <span>{steps.length - 1} 2-Opt Swaps</span>
            </div>

            {/* Visualizer Trigger Button */}
            {steps.length > 1 && onOpenVisualizer && (
                <button
                    onClick={onOpenVisualizer}
                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    <span>▶️</span>
                    <span>Step-by-Step 2-Opt Visualizer</span>
                </button>
            )}

        </div>
    );
}

export default AlgorithmBenchmark;
