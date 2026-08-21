// ─── RouteSummary ───────────────────────────────────────────────────────────
//
// WHAT IS THIS?
//   A "presentational component" — it has no state, no side effects.
//   It receives data through props and simply displays it.
//   This makes it easy to understand, test, and reuse.
//
// PROPS:
//   depot          → [lat, lng] of the depot
//   optimizedStops → array of stop objects in optimized visit order
//   totalDistance  → number (km), already calculated by routeDistance.js
// ───────────────────────────────────────────────────────────────────────────

function RouteSummary({ depot, optimizedStops, totalDistance }) {

    // Don't render anything if there's no route to show
    if (!depot || optimizedStops.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">

            {/* Header */}
            <div className="bg-blue-600 px-4 py-3">
                <h3 className="text-white font-semibold text-sm tracking-wide uppercase">
                    Route Summary
                </h3>
            </div>

            <div className="p-4 space-y-4">

                {/* Start */}
                <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                        Start
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🏭</span>
                        <div>
                            <p className="text-sm font-medium text-gray-800">Depot</p>
                            <p className="text-xs text-gray-400">
                                {depot[0].toFixed(4)}, {depot[1].toFixed(4)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <hr className="border-gray-100" />

                {/* Stops */}
                <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                        Stops ({optimizedStops.length})
                    </p>
                    <ol className="space-y-2">
                        {optimizedStops.map((stop, index) => (
                            <li key={stop.id} className="flex items-start gap-2">
                                {/* Step number badge */}
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">
                                    {index + 1}
                                </span>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">
                                        {stop.name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {stop.position[0].toFixed(4)}, {stop.position[1].toFixed(4)}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* Return to depot */}
                <div className="flex items-center gap-2">
                    <span className="text-lg">🏭</span>
                    <p className="text-sm text-gray-500 italic">Return to Depot</p>
                </div>

                {/* Divider */}
                <hr className="border-gray-100" />

                {/* Totals */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Distance</span>
                        <span className="text-sm font-bold text-blue-600">
                            {totalDistance.toFixed(2)} km
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Number of Stops</span>
                        <span className="text-sm font-bold text-gray-800">
                            {optimizedStops.length}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default RouteSummary;
