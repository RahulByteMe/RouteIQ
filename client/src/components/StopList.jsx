// ─── StopList ───────────────────────────────────────────────────────────────
//
// PROPS:
//   stops    → array of stop objects
//   onEdit   → function(stop) — called when dispatcher clicks Edit
//   onDelete → function(id) — called when dispatcher clicks Delete
// ───────────────────────────────────────────────────────────────────────────

function StopList({ stops, onDelete, onEdit }) {

    // ── Empty state ─────────────────────────────────────────────────────────
    // Always handle the case where the list is empty.
    // Rendering nothing silently is confusing — show a helpful message instead.
    if (stops.length === 0) {
        return (
            <div className="text-center py-6">
                <p className="text-sm text-gray-400">No stops added yet.</p>
                <p className="text-xs text-gray-300 mt-1">
                    Click the map or enter coordinates to add a stop.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">

            {/* Header row */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                    Delivery Stops
                </p>
                <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">
                    {stops.length} stop{stops.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Stop cards */}
            {stops.map((stop, index) => (
                <div
                    key={stop.id}
                    className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                >
                    {/* Stop number badge */}
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-800 text-white text-xs font-bold flex items-center justify-center">
                        {index + 1}
                    </span>

                    {/* Stop info */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                            {stop.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {stop.position[0].toFixed(4)}, {stop.position[1].toFixed(4)}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 flex-shrink-0">
                        <button
                            onClick={() => onEdit(stop)}
                            className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Edit this stop"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => onDelete(stop.id)}
                            className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Delete this stop"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ))}

        </div>
    );
}

export default StopList;