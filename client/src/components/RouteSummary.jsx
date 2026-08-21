// ─── RouteSummary Component ────────────────────────────────────────────────
//
// WHAT IT DOES:
//   Displays the active sequenced route overview, depot coordinates, total
//   distance (km), and stop-by-stop itinerary.
// ───────────────────────────────────────────────────────────────────────────

function RouteSummary({
    depot = null,
    stops = [],
    optimizedStops = null,
    totalDistance = 0,
    osrmDistance = 0,
    hasOptimized = false
}) {
    const displayStops = optimizedStops || stops || [];
    const distanceKm = Number(totalDistance || osrmDistance || 0);

    if (!depot || displayStops.length === 0 || !hasOptimized) {
        return null;
    }

    return (
        <div className="space-y-3 text-xs">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-gray-950/70 p-2.5 rounded-xl border border-gray-800/80">
                    <span className="text-gray-400 block text-[10px]">Hub Depot</span>
                    <span className="font-mono text-emerald-400 font-semibold truncate block">
                        {depot[0].toFixed(3)}, {depot[1].toFixed(3)}
                    </span>
                </div>
                <div className="bg-gray-950/70 p-2.5 rounded-xl border border-gray-800/80">
                    <span className="text-gray-400 block text-[10px]">Total Distance</span>
                    <span className="font-mono text-blue-400 font-bold block">
                        {distanceKm.toFixed(2)} km
                    </span>
                </div>
            </div>

            {/* Sequence preview (stops itinerary) */}
            <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    <span>Sequenced Itinerary:</span>
                    <span className="text-gray-500 font-mono">{displayStops.length} stops</span>
                </div>
                <ol className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {displayStops.map((stop, idx) => (
                        <li key={stop.id || idx} className="flex items-center gap-2 text-[11px] text-gray-300 bg-gray-950/40 p-1.5 rounded-lg border border-gray-800/40">
                            <span className="w-4 h-4 rounded-full bg-blue-600/40 text-blue-300 font-mono text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                                {idx + 1}
                            </span>
                            <span className="truncate flex-1">{stop.name}</span>
                            {stop.priority === "urgent" && (
                                <span className="text-[9px] text-red-400 font-bold">⚡</span>
                            )}
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}

export default RouteSummary;
