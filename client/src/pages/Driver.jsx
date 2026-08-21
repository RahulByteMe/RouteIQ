import { useState, useEffect, useRef, useCallback } from "react";
import MapView from "../components/MapView";
import { socket } from "../services/socket";
import calculateDistance from "../utils/distance";

// ─── Driver Page ─────────────────────────────────────────────────────────────
//
// WHO USES THIS:
//   The delivery driver — the person on the road making deliveries.
//
// PORTFOLIO & REAL-TIME FEATURES:
//   1. Sub-second GPS telemetry emission to dispatchers via WebSockets.
//   2. Live Turn-by-Turn Next Stop Guidance & Direct Google Maps deep-link.
//   3. Responsive Mobile View Mode (Map vs Checklist).
//   4. 250m auto-arrival stop check-off with smooth interpolation.
// ─────────────────────────────────────────────────────────────────────────────

function Driver() {

    // ── Published Route State ─────────────────────────────────────────────
    const [publishedRoute, setPublishedRoute] = useState(() => {
        const saved = localStorage.getItem("routeiq_published_route");
        return saved ? JSON.parse(saved) : null;
    });

    // ── Driver Progress ───────────────────────────────────────────────────
    const [completedIds, setCompletedIds] = useState(() => {
        const saved = localStorage.getItem("routeiq_driver_progress");
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    // ── Driver Progress Ref ──────────────────────────────────────────────
    const completedIdsRef = useRef(completedIds);
    useEffect(() => {
        completedIdsRef.current = completedIds;
    }, [completedIds]);

    // ── Real-Time Telemetry & Simulation State ─────────────────────────────
    const [isSimulating, setIsSimulating] = useState(false);
    const [isLiveGps, setIsLiveGps] = useState(false);
    const [driverPosition, setDriverPosition] = useState(() => {
        const saved = localStorage.getItem("routeiq_published_route");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.depot || null;
            } catch {
                return null;
            }
        }
        return null;
    });
    const [driverHeading, setDriverHeading] = useState(0);
    const [driverSpeed, setDriverSpeed] = useState(0);
    const [isDeviated, setIsDeviated] = useState(false);
    const [mobileTab, setMobileTab] = useState("checklist"); // "checklist" | "map"

    const simulationIndexRef = useRef(0);
    const simulationTimerRef = useRef(null);
    const geoWatchIdRef = useRef(null);

    // ── Listen for New Routes from Dispatcher via WebSockets ───────────────
    useEffect(() => {
        function handleNewRoute(newRoute) {
            if (newRoute && newRoute.stops) {
                setPublishedRoute(newRoute);
                setCompletedIds(new Set());
                localStorage.setItem("routeiq_published_route", JSON.stringify(newRoute));
                localStorage.removeItem("routeiq_driver_progress");
                if (newRoute.depot) {
                    setDriverPosition(newRoute.depot);
                }
            }
        }

        socket.on("dispatcher:route_published", handleNewRoute);
        return () => socket.off("dispatcher:route_published", handleNewRoute);
    }, []);

    // ── Broadcast Telemetry Helper ────────────────────────────────────────
    const broadcastTelemetry = useCallback((pos, heading = 0, speed = 0, deviated = false) => {
        setDriverPosition(pos);
        setDriverHeading(heading);
        setDriverSpeed(speed);
        setIsDeviated(deviated);

        socket.emit("driver:location_update", {
            position: pos,
            heading,
            speed,
            isDeviated: deviated
        });
    }, []);

    // ── Toggle Stop Done ──────────────────────────────────────────────────
    const toggleStopDone = useCallback((stopId) => {
        setCompletedIds((prevCompleted) => {
            const newCompleted = new Set(prevCompleted);
            const isDone = !newCompleted.has(stopId);

            if (isDone) {
                newCompleted.add(stopId);
            } else {
                newCompleted.delete(stopId);
            }

            localStorage.setItem("routeiq_driver_progress", JSON.stringify([...newCompleted]));
            // Broadcast to Dispatcher via WebSocket
            socket.emit("driver:stop_completed", { stopId, isDone });
            return newCompleted;
        });
    }, []);

    // ── Clear Progress ────────────────────────────────────────────────────
    function handleClearProgress() {
        if (!window.confirm("Clear all delivery progress? This cannot be undone.")) {
            return;
        }
        setCompletedIds(new Set());
        localStorage.removeItem("routeiq_driver_progress");
        if (publishedRoute?.depot) {
            broadcastTelemetry(publishedRoute.depot, 0, 0, false);
        }
    }

    // ── Route Drive Simulation ────────────────────────────────────────────
    useEffect(() => {
        if (!isSimulating || !publishedRoute) {
            if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
            return;
        }

        const path = publishedRoute.osrmRoute && publishedRoute.osrmRoute.length > 0
            ? publishedRoute.osrmRoute
            : [publishedRoute.depot, ...publishedRoute.stops.map(s => s.position), publishedRoute.depot];

        socket.emit("driver:status_toggle", { isLive: false, isSimulating: true });

        simulationTimerRef.current = setInterval(() => {
            simulationIndexRef.current = (simulationIndexRef.current + 1) % path.length;
            const idx = simulationIndexRef.current;
            const currentPos = path[idx];
            const nextPos = path[(idx + 1) % path.length];

            const dy = nextPos[0] - currentPos[0];
            const dx = nextPos[1] - currentPos[1];
            const headingDeg = Math.round((Math.atan2(dx, dy) * 180) / Math.PI);

            broadcastTelemetry(currentPos, headingDeg, 45, false);

            // Auto-complete stops when vehicle comes within delivery radius (250m)
            publishedRoute.stops.forEach((stop) => {
                const distToStop = calculateDistance(currentPos, stop.position);
                if (distToStop <= 0.25 && !completedIdsRef.current.has(stop.id)) {
                    toggleStopDone(stop.id);
                }
            });

        }, 350);

        return () => {
            if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
        };
    }, [isSimulating, publishedRoute, broadcastTelemetry, toggleStopDone]);

    // ── Real Browser Geolocation Watcher ──────────────────────────────────
    useEffect(() => {
        if (!isLiveGps) {
            if (geoWatchIdRef.current) navigator.geolocation.clearWatch(geoWatchIdRef.current);
            return;
        }

        if (!navigator.geolocation) {
            return;
        }

        socket.emit("driver:status_toggle", { isLive: true, isSimulating: false });

        geoWatchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const heading = pos.coords.heading || 0;
                const speed = Math.round((pos.coords.speed || 0) * 3.6);

                broadcastTelemetry([lat, lng], heading, speed, false);
            },
            (err) => {
                console.error("GPS error:", err);
            },
            { enableHighAccuracy: true, maximumAge: 2000 }
        );

        return () => {
            if (geoWatchIdRef.current) navigator.geolocation.clearWatch(geoWatchIdRef.current);
        };
    }, [isLiveGps, broadcastTelemetry]);

    // ── Simulate Detour (Test Deviation Alert) ─────────────────────────────
    function handleSimulateDetour() {
        if (!driverPosition) return;
        setIsSimulating(false);
        setIsLiveGps(false);

        const detourPos = [driverPosition[0] + 0.0085, driverPosition[1] + 0.0085];
        broadcastTelemetry(detourPos, 45, 30, true);
    }


    // ── No route published yet ────────────────────────────────────────────
    if (!publishedRoute) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-57px)] bg-gray-950 text-gray-100">
                <div className="text-center max-w-sm mx-auto p-8 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl">
                    <div className="text-6xl mb-4">🚚</div>
                    <h2 className="text-lg font-bold text-white mb-2">
                        No Route Assigned
                    </h2>
                    <p className="text-gray-400 text-xs leading-relaxed mb-4">
                        The dispatcher hasn't published an active delivery route yet.
                    </p>
                    <a
                        href="/dispatcher"
                        className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                        Go to Dispatcher Dashboard →
                    </a>
                </div>
            </div>
        );
    }

    const { depot, stops, osrmRoute, publishedAt } = publishedRoute;
    const totalCount = stops.length;
    const completedCount = completedIds.size;
    const allDone = completedCount === totalCount;

    // Find next uncompleted stop
    const nextStop = stops.find((s) => !completedIds.has(s.id));
    const distToNext = (nextStop && driverPosition)
        ? Math.round(calculateDistance(driverPosition, nextStop.position) * 10) / 10
        : null;


    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-57px)] overflow-hidden bg-gray-950 text-gray-100">

            {/* ── MOBILE VIEW TAB SWITCHER ─────────────────────────── */}
            <div className="md:hidden flex bg-gray-900 border-b border-gray-800 p-2 gap-2 flex-shrink-0 z-20">
                <button
                    onClick={() => setMobileTab("checklist")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        mobileTab === "checklist"
                            ? "bg-blue-600 text-white shadow"
                            : "bg-gray-800 text-gray-400"
                    }`}
                >
                    📋 Stops ({completedCount}/{totalCount})
                </button>
                <button
                    onClick={() => setMobileTab("map")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        mobileTab === "map"
                            ? "bg-blue-600 text-white shadow"
                            : "bg-gray-800 text-gray-400"
                    }`}
                >
                    🗺️ Turn-by-Turn Map
                </button>
            </div>

            {/* ── DRIVER SIDEBAR ───────────────────────────────────── */}
            <aside className={`w-full md:w-96 flex flex-col bg-gray-900 border-r border-gray-800 overflow-y-auto flex-shrink-0 ${
                mobileTab === "map" ? "hidden md:flex" : "flex"
            }`}>

                {/* Header */}
                <div className="px-4 py-3.5 bg-gray-950 border-b border-gray-800">
                    <div className="flex items-center justify-between">
                        <h1 className="text-white font-extrabold text-base tracking-tight flex items-center gap-1.5">
                            <span>🚚</span> Driver Navigation
                        </h1>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                            Live WebSocket
                        </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1 font-mono text-[11px]">
                        Published: {publishedAt}
                    </p>
                </div>

                {/* ── NEXT STOP TURN-BY-TURN GUIDANCE CARD ── */}
                {nextStop && (
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-950/90 to-indigo-950/90 border-b border-blue-900/60 text-white space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1">
                                <span>🎯</span> Next Delivery Target
                            </span>
                            {nextStop.priority === "urgent" && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                                    ⚡ URGENT
                                </span>
                            )}
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-white truncate">{nextStop.name}</h3>
                            <p className="text-xs text-gray-300 mt-0.5 font-mono">
                                {distToNext !== null ? `~${distToNext} km away` : "En route"}
                            </p>
                        </div>

                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${nextStop.position[0]},${nextStop.position[1]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center justify-center gap-1.5"
                        >
                            <span>🗺️</span>
                            <span>Open in Google Maps Navigation</span>
                        </a>
                    </div>
                )}

                {/* ── TELEMETRY & SIMULATOR CONTROLS ── */}
                <div className="px-4 py-3 bg-gray-950/70 border-b border-gray-800 space-y-2.5">
                    <p className="text-[11px] uppercase font-bold tracking-wider text-blue-400">
                        📡 Telemetry & Simulation Controls
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => {
                                setIsLiveGps(false);
                                setIsSimulating((prev) => !prev);
                            }}
                            className={`py-2 px-2 text-xs font-semibold rounded-lg shadow transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                isSimulating
                                    ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20"
                                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                            }`}
                        >
                            <span>{isSimulating ? "⏸ Stop Sim" : "🚀 Drive Sim"}</span>
                        </button>

                        <button
                            onClick={() => {
                                setIsSimulating(false);
                                setIsLiveGps((prev) => !prev);
                            }}
                            className={`py-2 px-2 text-xs font-semibold rounded-lg shadow transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                isLiveGps
                                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                    : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                            }`}
                        >
                            <span>{isLiveGps ? "📡 Live GPS: ON" : "📱 Browser GPS"}</span>
                        </button>
                    </div>

                    {/* Detour Trigger */}
                    <button
                        onClick={handleSimulateDetour}
                        className="w-full py-1.5 bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                        <span>⚠️ Simulate Off-Route Detour</span>
                    </button>

                    {/* Live Telemetry Pill */}
                    {driverPosition && (
                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-2 text-[11px] font-mono text-gray-300 flex justify-between items-center">
                            <span>Speed: <strong>{driverSpeed} km/h</strong></span>
                            <span>Heading: <strong>{driverHeading}°</strong></span>
                            <span className={isDeviated ? "text-rose-400 font-bold" : "text-emerald-400"}>
                                {isDeviated ? "OFF-ROUTE" : "ON-ROUTE"}
                            </span>
                        </div>
                    )}
                </div>

                {/* ── PROGRESS SUMMARY ── */}
                <div className="px-4 py-3.5 border-b border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                            Delivery Progress
                        </p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            allDone ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"
                        }`}>
                            {completedCount} / {totalCount} Done
                        </span>
                    </div>

                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                                allDone ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-blue-500 shadow-sm shadow-blue-500/50"
                            }`}
                            style={{
                                width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%"
                            }}
                        />
                    </div>

                    {allDone && (
                        <p className="mt-2 text-xs font-bold text-emerald-400 text-center">
                            🎉 All deliveries complete!
                        </p>
                    )}
                </div>

                {/* ── DEPOT INFO ── */}
                <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2.5">
                    <span className="text-lg">🏭</span>
                    <div>
                        <p className="text-xs font-bold text-gray-200">Depot (Start / Return)</p>
                        <p className="text-[11px] text-gray-400 font-mono">
                            {depot[0].toFixed(4)}, {depot[1].toFixed(4)}
                        </p>
                    </div>
                </div>

                {/* ── STOP CHECKLIST ── */}
                <div className="px-4 py-3.5 flex-1">
                    <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-2.5">
                        Delivery Sequence ({stops.length})
                    </p>

                    <div className="space-y-2">
                        {stops.map((stop, index) => {
                            const isDone = completedIds.has(stop.id);

                            return (
                                <div
                                    key={stop.id}
                                    onClick={() => toggleStopDone(stop.id)}
                                    className={`
                                        flex items-center gap-3 rounded-xl border p-3 cursor-pointer
                                        transition-all duration-200
                                        ${isDone
                                            ? "bg-emerald-950/30 border-emerald-900/60 opacity-60"
                                            : "bg-gray-800/80 border-gray-700/60 hover:border-blue-500 hover:bg-gray-800"
                                        }
                                    `}
                                >
                                    <div className={`
                                        flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                                        transition-colors duration-200
                                        ${isDone ? "bg-emerald-500 text-white" : "bg-gray-700 text-gray-300"}
                                    `}>
                                        {isDone ? "✓" : index + 1}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className={`text-xs font-semibold truncate ${
                                                isDone ? "line-through text-gray-500" : "text-white"
                                            }`}>
                                                {stop.name}
                                            </p>
                                            {stop.priority === "urgent" && (
                                                <span className="text-[10px] text-red-400 font-bold">⚡</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                            {stop.position[0].toFixed(4)}, {stop.position[1].toFixed(4)}
                                        </p>
                                    </div>

                                    <span className="text-[11px] text-gray-400 flex-shrink-0 font-medium">
                                        {isDone ? "Done" : "Tap"}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── CLEAR PROGRESS ── */}
                {completedCount > 0 && (
                    <div className="px-4 py-3 border-t border-gray-800">
                        <button
                            onClick={handleClearProgress}
                            className="w-full py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer font-medium"
                        >
                            ↺ Clear Progress
                        </button>
                    </div>
                )}

            </aside>

            {/* ── MAP (Full width on mobile when map tab is active) ── */}
            <div className={`flex-1 h-full relative ${
                mobileTab === "checklist" ? "hidden md:block" : "block"
            }`}>
                <MapView
                    stops={stops}
                    depot={depot}
                    onMapClick={() => {}}
                    selectedPosition={null}
                    routePositions={osrmRoute || []}
                    driverPosition={driverPosition}
                    driverHeading={driverHeading}
                    isDeviated={isDeviated}
                />
            </div>

        </div>
    );
}

export default Driver;