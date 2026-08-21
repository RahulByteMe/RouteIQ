// ─── ManifestModal Component ──────────────────────────────────────────────
//
// Displays a printable, interactive delivery route manifest table with:
// 1. Direct CSV download
// 2. One-click Copy to Clipboard
// 3. Print / Save as PDF
// ───────────────────────────────────────────────────────────────────────────

function ManifestModal({
    isOpen,
    onClose,
    stops = [],
    depot = null,
    totalDistance = 0,
    benchmarkData = null,
    completedIds = new Set()
}) {
    if (!isOpen) return null;

    const exportCsv = () => {
        let csvContent = "Sequence,Stop Name,Priority,Latitude,Longitude,Status\n";

        stops.forEach((stop, index) => {
            const isDone = completedIds.has(stop.id) ? "Completed" : "Pending";
            const row = [
                index + 1,
                `"${(stop.name || "").replace(/"/g, '""')}"`,
                stop.priority || "standard",
                stop.position ? stop.position[0] : "",
                stop.position ? stop.position[1] : "",
                isDone
            ].join(",");
            csvContent += row + "\n";
        });

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `RouteIQ_Manifest_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = () => {
        let textContent = "RouteIQ Delivery Manifest\n";
        textContent += `Generated: ${new Date().toLocaleString()}\n`;
        textContent += `Total Distance: ${totalDistance} km\n\n`;
        textContent += "Seq | Stop Name | Priority | Coordinates | Status\n";
        textContent += "---------------------------------------------------------\n";

        stops.forEach((stop, index) => {
            const isDone = completedIds.has(stop.id) ? "Completed" : "Pending";
            textContent += `${index + 1} | ${stop.name} | ${stop.priority || "standard"} | ${stop.position[0]}, ${stop.position[1]} | ${isDone}\n`;
        });

        navigator.clipboard.writeText(textContent).then(() => {
            alert("📋 Manifest copied to clipboard!");
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* Modal Header */}
                <div className="px-6 py-4 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                            <span>📄</span> Delivery Route Manifest
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">
                            Generated on {new Date().toLocaleDateString()} • {stops.length} Stops • {totalDistance} km
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center text-sm cursor-pointer transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Summary Badges */}
                <div className="px-6 py-3 bg-gray-950/40 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    {depot && (
                        <div className="text-gray-300">
                            <span className="text-gray-500 font-mono">Depot: </span>
                            <span className="font-mono font-bold text-blue-400">{depot[0].toFixed(4)}, {depot[1].toFixed(4)}</span>
                        </div>
                    )}
                    {benchmarkData?.savingsPercent > 0 && (
                        <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-semibold">
                            🌱 -{benchmarkData.savingsPercent}% Distance Saved (~{benchmarkData.co2SavedKg}kg CO₂)
                        </div>
                    )}
                </div>

                {/* Table Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="border border-gray-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs font-mono">
                            <thead className="bg-gray-950 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                                <tr>
                                    <th className="p-3">#</th>
                                    <th className="p-3">Stop Name</th>
                                    <th className="p-3">Priority</th>
                                    <th className="p-3">Coordinates</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/60 text-gray-200">
                                {stops.map((stop, index) => {
                                    const isDone = completedIds.has(stop.id);
                                    return (
                                        <tr key={stop.id} className="hover:bg-gray-800/40 transition-colors">
                                            <td className="p-3 font-bold text-blue-400">{index + 1}</td>
                                            <td className="p-3 font-medium text-white">{stop.name}</td>
                                            <td className="p-3">
                                                {stop.priority === "urgent" ? (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                                                        ⚡ URGENT
                                                    </span>
                                                ) : stop.priority === "flexible" ? (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                                        Flexible
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-[10px] text-gray-400">
                                                        Standard
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-gray-400">
                                                {stop.position ? `${stop.position[0].toFixed(4)}, ${stop.position[1].toFixed(4)}` : "—"}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    isDone
                                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                                        : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                                                }`}>
                                                    {isDone ? "✓ Completed" : "Pending"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="px-6 py-4 bg-gray-950 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-2">
                        <button
                            onClick={exportCsv}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                            <span>📥</span>
                            <span>Download CSV</span>
                        </button>
                        <button
                            onClick={copyToClipboard}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-lg border border-gray-700 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                            <span>📋</span>
                            <span>Copy CSV / Text</span>
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-lg border border-gray-700 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                            <span>🖨️</span>
                            <span>Print Manifest</span>
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
}

export default ManifestModal;
