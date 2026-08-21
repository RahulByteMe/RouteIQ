// ─── AlgorithmBenchmark Component ──────────────────────────────────────────
//
// WHAT IT DOES:
//   Displays a transparent comparative audit of the self-implemented algorithms
//   (Nearest-Neighbor Construction + 2-Opt Local Search) against naive order.
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

    // Calculate relative width percentages for the comparison bars
    const naivePct = 100;
    const nnPct = naiveDistance > 0 ? Math.round((nnDistance / naiveDistance) * 100) : 100;
    const twoOptPct = naiveDistance > 0 ? Math.round((twoOptDistance / naiveDistance) * 100) : 100;

    return (
        <div className="text-white space-y-3 text-xs">

            {/* Comparison Bars */}
            <div className="space-y-2.5 bg-gray-950/60 p-3 rounded-xl border border-gray-800/80">
                
                {/* 1. Naive Baseline */}
                <div>
                    <div className="flex justify-between text-gray-400 mb-1 font-mono text-[11px]">
                        <span>1. Naive Input Order</span>
                        <span>{naiveDistance} km</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-rose-500 h-1.5 rounded-full transition-all duration-500"
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
                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
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
                        <span className="text-emerald-400 font-bold">{twoOptDistance} km (-{savingsPercent}%)</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500 shadow-sm shadow-emerald-500/50"
                            style={{ width: `${twoOptPct}%` }}
                        />
                    </div>
                </div>

            </div>

            {/* Green Logistics & ESG Eco-Impact */}
            {benchmarkData.kmSaved > 0 && (
                <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-2.5 space-y-1">
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
            <div className="pt-1 flex items-center justify-between text-[11px] text-gray-400">
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
                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    <span>▶️</span>
                    <span>Step-by-Step 2-Opt Visualizer</span>
                </button>
            )}

        </div>
    );
}

export default AlgorithmBenchmark;
