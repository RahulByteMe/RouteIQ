import MapView from "../components/MapView";
import { useEffect, useState } from "react";
import initialStops from "../data/stops";
import StopList from "../components/StopList";
import AddStopForm from "../components/AddStopForm";
import RouteSummary from "../components/RouteSummary";
import optimizeRoute from "../utils/optimizeRoute";
import calculateRouteDistance from "../utils/routeDistance";

function MapDemo() {

    // ── Stop form inputs ────────────────────────────────────────────────────
    const [name, setName] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");

    // ── Stops ───────────────────────────────────────────────────────────────
    // Lazy initialiser: reads localStorage once on first render only.
    const [stops, setStops] = useState(() => {
        const saved = localStorage.getItem("stops");
        return saved ? JSON.parse(saved) : initialStops;
    });

    // ── Depot ───────────────────────────────────────────────────────────────
    // null = no depot selected yet.
    const [depot, setDepot] = useState(() => {
        const saved = localStorage.getItem("depot");
        return saved ? JSON.parse(saved) : null;
    });

    // ── Depot mode ──────────────────────────────────────────────────────────
    // When true, the next map click sets the depot instead of filling the form.
    const [isDepotMode, setIsDepotMode] = useState(false);

    // ── Editing ─────────────────────────────────────────────────────────────
    // null = "add mode" | a stop's id = "edit mode for that stop"
    const [editingId, setEditingId] = useState(null);

    // ── Pending map click position ──────────────────────────────────────────
    // Shown as a marker while the user is filling the form.
    // Separate from depot — do not confuse them.
    const [selectedPosition, setSelectedPosition] = useState(null);

    // ── Optimization state (Phase 6) ────────────────────────────────────────
    //
    // WHY STATE, NOT A COMPUTED VALUE?
    //   If we wrote:  const optimizedStops = optimizeRoute(stops, depot);
    //   ...it would re-run on EVERY render — including while typing in the form.
    //   Storing the result in state means optimization only happens when the
    //   user explicitly clicks "Optimize Route".
    //
    const [optimizedStops, setOptimizedStops] = useState([]);

    // true = a route has been computed and is currently displayed.
    // false = no route, or the route was reset.
    const [hasOptimized, setHasOptimized] = useState(false);


    // ── Persist stops ───────────────────────────────────────────────────────
    useEffect(() => {
        localStorage.setItem("stops", JSON.stringify(stops));
    }, [stops]);

    // ── Persist depot ───────────────────────────────────────────────────────
    useEffect(() => {
        if (depot !== null) {
            localStorage.setItem("depot", JSON.stringify(depot));
        }
    }, [depot]);


    // ── resetRoute ──────────────────────────────────────────────────────────
    //
    // WHY A HELPER FUNCTION?
    //   Several actions make the current optimized route stale:
    //   adding/editing/deleting a stop, or changing the depot.
    //   Instead of repeating the same two setters everywhere, we call
    //   this small helper. This is the DRY principle: Don't Repeat Yourself.
    //
    function resetRoute() {
        setOptimizedStops([]);
        setHasOptimized(false);
    }


    // ── handleMapClick ──────────────────────────────────────────────────────
    function handleMapClick(e) {
        const { lat, lng } = e.latlng;

        if (isDepotMode) {
            setDepot([lat, lng]);
            setIsDepotMode(false);
            resetRoute(); // changing the depot makes any existing route stale
        } else {
            setLatitude(lat.toFixed(6));
            setLongitude(lng.toFixed(6));
            setSelectedPosition([lat, lng]);
        }
    }


    // ── handleAddStop ───────────────────────────────────────────────────────
    // Note: AddStopForm now validates before calling this, so we can trust
    // that name/latitude/longitude are valid when this runs.
    function handleAddStop() {
        if (editingId === null) {
            const newStop = {
                id: Date.now(), // timestamp IDs never collide, even after deletions
                name: name,
                position: [Number(latitude), Number(longitude)]
            };
            setStops([...stops, newStop]);
        } else {
            setStops(
                stops.map((stop) =>
                    stop.id === editingId
                        ? {
                            id: stop.id,
                            name: name,
                            position: [Number(latitude), Number(longitude)]
                        }
                        : stop
                )
            );
            setEditingId(null);
        }

        // Clear the form
        setName("");
        setLatitude("");
        setLongitude("");
        setSelectedPosition(null);

        // Stops changed — the old optimized route is now stale
        resetRoute();
    }


    // ── handleDeleteStop ────────────────────────────────────────────────────
    function handleDeleteStop(id) {
        setStops(stops.filter((stop) => stop.id !== id));
        resetRoute(); // stops changed → route is stale
    }


    // ── handleEditStop ──────────────────────────────────────────────────────
    function handleEditStop(stop) {
        setEditingId(stop.id);
        setName(stop.name);
        setLatitude(stop.position[0]);
        setLongitude(stop.position[1]);
        // No resetRoute here — we haven't changed any stop data yet.
        // The route resets in handleAddStop when the edit is saved.
    }


    // ── handleCancelEdit ────────────────────────────────────────────────────
    function handleCancelEdit() {
        setEditingId(null);
        setName("");
        setLatitude("");
        setLongitude("");
        setSelectedPosition(null);
    }


    // ── handleOptimize (Phase 6) ─────────────────────────────────────────────
    //
    // EDGE CASES HANDLED:
    //   - No depot: show a message, do nothing.
    //   - 0 stops: show a message, do nothing.
    //   - 1 stop: valid — optimizeRoute handles it (nearest-neighbor with 1 stop
    //     just returns that 1 stop; round-trip = depot → stop → depot).
    //
    function handleOptimize() {
        if (!depot) {
            alert("Please set a depot first.\n\nClick '🏭 Set Depot', then click the map.");
            return;
        }
        if (stops.length === 0) {
            alert("Please add at least one delivery stop.");
            return;
        }

        const result = optimizeRoute(stops, depot);
        setOptimizedStops(result);
        setHasOptimized(true);
    }


    // ── handleResetRoute (Phase 6) ───────────────────────────────────────────
    function handleResetRoute() {
        resetRoute();
    }


    // ── routePositions ───────────────────────────────────────────────────────
    // Build the array of [lat, lng] points for the Polyline.
    // Only built when a route has been optimized.
    //
    // Round trip:  depot → stop1 → stop2 → ... → depot
    //
    const routePositions =
        hasOptimized && depot && optimizedStops.length > 0
            ? [depot, ...optimizedStops.map((s) => s.position), depot]
            : [];


    // ── totalDistance ────────────────────────────────────────────────────────
    const totalDistance = hasOptimized
        ? calculateRouteDistance(depot, optimizedStops)
        : 0;


    // ── Render ───────────────────────────────────────────────────────────────
    return (
        // SIDEBAR LAYOUT:
        //   flex         → children lay out in a row (sidebar | map)
        //   h-screen     → the whole layout fills the viewport height
        //   overflow-hidden → prevents any accidental scrollbars on the outer div
        <div className="flex h-screen overflow-hidden">

            {/* ────────── LEFT SIDEBAR ────────────────────────────────── */}
            <aside className="w-80 flex flex-col bg-gray-50 border-r border-gray-200 overflow-y-auto flex-shrink-0">

                {/* App title */}
                <div className="px-4 py-4 bg-gray-900 border-b border-gray-700">
                    <h1 className="text-white font-bold text-lg tracking-tight">
                        RouteIQ
                    </h1>
                    <p className="text-gray-400 text-xs mt-0.5">
                        Delivery Route Optimizer
                    </p>
                </div>

                {/* ── DEPOT SECTION ── */}
                <div className="px-4 py-4 border-b border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-3">
                        Depot / Warehouse
                    </p>

                    {/* Depot mode status */}
                    {isDepotMode && (
                        <div className="mb-3 bg-amber-50 border border-amber-300 rounded-md px-3 py-2">
                            <p className="text-xs text-amber-700 font-medium">
                                🏭 Click anywhere on the map to place the depot.
                            </p>
                        </div>
                    )}

                    <button
                        onClick={() => setIsDepotMode((prev) => !prev)}
                        className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${
                            isDepotMode
                                ? "bg-amber-500 hover:bg-amber-600 text-white"
                                : "bg-red-500 hover:bg-red-600 text-white"
                        }`}
                    >
                        {isDepotMode ? "🏭 Click the map…" : "🏭 Set Depot"}
                    </button>

                    {/* Current depot display */}
                    {depot ? (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 bg-white rounded border border-gray-200 px-3 py-2">
                            <span>🏭</span>
                            <span className="text-xs font-mono text-gray-500">
                                {depot[0].toFixed(4)}, {depot[1].toFixed(4)}
                            </span>
                        </div>
                    ) : (
                        <p className="mt-2 text-xs text-gray-400 text-center">
                            No depot set yet.
                        </p>
                    )}
                </div>

                {/* ── ADD / EDIT STOP SECTION ── */}
                <div className="px-4 py-4 border-b border-gray-200">
                    <AddStopForm
                        name={name}
                        latitude={latitude}
                        longitude={longitude}
                        setName={setName}
                        setLatitude={setLatitude}
                        setLongitude={setLongitude}
                        onAddStop={handleAddStop}
                        onCancelEdit={handleCancelEdit}
                        editingId={editingId}
                        onLocationSelect={setSelectedPosition}
                    />
                </div>

                {/* ── STOP LIST SECTION ── */}
                <div className="px-4 py-4 border-b border-gray-200">
                    <StopList
                        stops={stops}
                        onDelete={handleDeleteStop}
                        onEdit={handleEditStop}
                    />
                </div>

                {/* ── OPTIMIZATION CONTROLS (Phase 6) ── */}
                <div className="px-4 py-4 border-b border-gray-200">
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-3">
                        Route Optimization
                    </p>

                    {/* Show a stale warning if stops/depot changed after optimization */}
                    {/* (hasOptimized is false when stale, so we just show the button) */}

                    <div className="flex gap-2">
                        <button
                            onClick={handleOptimize}
                            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                        >
                            ⚡ Optimize Route
                        </button>

                        {hasOptimized && (
                            <button
                                onClick={handleResetRoute}
                                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-md transition-colors"
                                title="Clear the optimized route"
                            >
                                ✕ Reset
                            </button>
                        )}
                    </div>

                    {/* Contextual help text */}
                    {!depot && (
                        <p className="mt-2 text-xs text-amber-600">
                            ⚠️ Set a depot before optimizing.
                        </p>
                    )}
                    {depot && stops.length === 0 && (
                        <p className="mt-2 text-xs text-amber-600">
                            ⚠️ Add at least one stop before optimizing.
                        </p>
                    )}
                </div>

                {/* ── ROUTE SUMMARY (Phase 4) ── */}
                {hasOptimized && (
                    <div className="px-4 py-4">
                        <RouteSummary
                            depot={depot}
                            optimizedStops={optimizedStops}
                            totalDistance={totalDistance}
                        />
                    </div>
                )}

            </aside>

            {/* ────────── MAP AREA ────────────────────────────────────── */}
            {/*
                flex-1   → takes all remaining horizontal space after sidebar
                h-full   → fills the full screen height (inherited from h-screen parent)
                relative → lets us position the depot mode banner absolutely over the map
            */}
            <div className="flex-1 h-full relative">

                {/* Depot mode overlay banner */}
                {isDepotMode && (
                    <div className="absolute top-0 left-0 right-0 z-[1000] bg-amber-500 text-white text-center text-sm py-2 font-medium">
                        🏭 Depot mode — click the map to place your depot
                        <button
                            onClick={() => setIsDepotMode(false)}
                            className="ml-4 underline hover:no-underline text-amber-100"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                <MapView
                    stops={stops}
                    depot={depot}
                    onMapClick={handleMapClick}
                    selectedPosition={selectedPosition}
                    routePositions={routePositions}
                />

            </div>

        </div>
    );
}

export default MapDemo;