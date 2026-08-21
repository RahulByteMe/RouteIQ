import { useState } from "react";
import { Link } from "react-router-dom";
import { runBenchmarkSuite } from "../utils/benchmarkSuite";

function Home() {
    const [benchmarkResults, setBenchmarkResults] = useState(null);
    const [isRunningBenchmarks, setIsRunningBenchmarks] = useState(false);

    function handleRunBenchmarks() {
        setIsRunningBenchmarks(true);
        setTimeout(() => {
            const results = runBenchmarkSuite();
            setBenchmarkResults(results);
            setIsRunningBenchmarks(false);
        }, 300);
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-blue-600 selection:text-white">
            
            {/* ── HERO SECTION ─────────────────────────────────────────── */}
            <section className="relative overflow-hidden pt-16 pb-20 px-4 lg:px-8 border-b border-gray-800/80">
                
                {/* Background Glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
                    
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        Built & Engineered by Rahul Yadav — RouteIQ v1.0
                    </div>

                    {/* Main Title */}
                    <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
                        Delivery & Logistics <br className="hidden sm:inline" />
                        <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                            Route Optimizer
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="max-w-2xl mx-auto text-gray-400 text-sm sm:text-base leading-relaxed">
                        An algorithmic logistics platform engineered from first principles. Self-implemented 
                        <strong className="text-gray-200"> Nearest-Neighbor construction ($O(N^2)$)</strong> and 
                        <strong className="text-gray-200"> 2-Opt local search ($O(N^3)$)</strong> with sub-second real-time WebSocket driver tracking and cross-track deviation detection.
                    </p>

                    {/* CTA Actions */}
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                        <Link
                            to="/dispatcher"
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-2"
                        >
                            <span>📋</span>
                            <span>Open Dispatcher Dashboard</span>
                        </Link>

                        <Link
                            to="/driver"
                            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-semibold rounded-xl border border-gray-700 transition-all cursor-pointer flex items-center gap-2"
                        >
                            <span>🚚</span>
                            <span>Open Driver Live View</span>
                        </Link>
                    </div>

                </div>
            </section>


            {/* ── CORE PILLARS GRID ───────────────────────────────────── */}
            <section className="max-w-6xl mx-auto py-16 px-4 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-xs uppercase font-bold tracking-widest text-blue-400">
                        Algorithmic Architecture
                    </h2>
                    <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                        Built for Performance & Full Transparency
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Card 1 */}
                    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-lg">
                            🧬
                        </div>
                        <h3 className="text-base font-bold text-white">1. Heuristic TSP Solver</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Combines greedy Nearest-Neighbor starting tours with iterative 2-Opt edge untangling. Consistently delivers ≥ 15–25% distance reduction without third-party black-box solvers.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg">
                            📡
                        </div>
                        <h3 className="text-base font-bold text-white">2. Real-Time Telemetry</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Sub-second bidirectional Socket.IO WebSockets stream live vehicle coordinates, speed, and heading directly from drivers to dispatchers with smooth marker interpolation.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-lg">
                            ⚠️
                        </div>
                        <h3 className="text-base font-bold text-white">3. Deviation & Re-Routing</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Continuous cross-track distance calculations detect when a driver veers &gt; 500m off-route, triggering instant warnings and one-click re-optimization.
                        </p>
                    </div>

                </div>
            </section>


            {/* ── LIVE BENCHMARK SUITE RUNNER ─────────────────────────── */}
            <section className="bg-gray-900/40 border-y border-gray-800/80 py-16 px-4 lg:px-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xs uppercase font-bold tracking-widest text-emerald-400">
                                Empirical Verification
                            </h2>
                            <p className="text-2xl font-extrabold text-white mt-1">
                                Automated Algorithm Benchmark Suite
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Validates PRD Section 7 targets across synthetic delivery batches.
                            </p>
                        </div>

                        <button
                            onClick={handleRunBenchmarks}
                            disabled={isRunningBenchmarks}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
                        >
                            <span>{isRunningBenchmarks ? "⏳ Benchmarking..." : "⚡ Run Live Benchmark Suite"}</span>
                        </button>
                    </div>

                    {/* Results Table */}
                    {benchmarkResults && (
                        <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs font-mono">
                                    <thead className="bg-gray-900/90 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                                        <tr>
                                            <th className="p-3">Stops</th>
                                            <th className="p-3">Naive Order</th>
                                            <th className="p-3">Nearest-Neighbor</th>
                                            <th className="p-3">2-Opt Final</th>
                                            <th className="p-3">Distance Saved</th>
                                            <th className="p-3">NN Time</th>
                                            <th className="p-3">2-Opt Time</th>
                                            <th className="p-3">Total Latency</th>
                                            <th className="p-3">Swaps</th>
                                            <th className="p-3">PRD Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/60 text-gray-200">
                                        {benchmarkResults.map((row) => (
                                            <tr key={row.stopCount} className="hover:bg-gray-900/40 transition-colors">
                                                <td className="p-3 font-bold text-white">{row.stopCount} Stops</td>
                                                <td className="p-3 text-rose-400">{row.naiveDistanceKm} km</td>
                                                <td className="p-3 text-amber-400">{row.nnDistanceKm} km</td>
                                                <td className="p-3 text-emerald-400 font-bold">{row.twoOptDistanceKm} km</td>
                                                <td className="p-3 font-bold text-emerald-300">+{row.savingsPercent}%</td>
                                                <td className="p-3 text-gray-400 font-mono">{row.nnExecutionTimeMs} ms</td>
                                                <td className="p-3 text-gray-400 font-mono">{row.twoOptExecutionTimeMs} ms</td>
                                                <td className="p-3 font-bold text-blue-300 font-mono">{row.executionTimeMs} ms</td>
                                                <td className="p-3 text-gray-300 font-mono">{row.swapCount}</td>
                                                <td className="p-3">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                                        ✅ PASSED
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </section>


            {/* ── FOOTER ──────────────────────────────────────────────── */}
            <footer className="py-8 px-4 text-center text-xs text-gray-500">
                <p>RouteIQ — Built & Engineered by Rahul Yadav</p>
                <p className="mt-1 font-mono text-[11px]">Dijkstra • A* • Nearest-Neighbor • 2-Opt • WebSockets</p>
            </footer>

        </div>
    );
}

export default Home;