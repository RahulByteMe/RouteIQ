import { useState, useEffect, useRef, useCallback } from "react";
import MapView from "../components/MapView";
import { socket } from "../services/socket";
import { fetchPublishedRoute } from "../services/api";
import calculateDistance from "../utils/distance";

// ─── Driver Page (Indian Logistics Route & DB Connected) ────────────────────
//
// WHO USES THIS:
//   The delivery driver on the road executing the sequenced delivery tour.
//
// FEATURES:
//   1. Pulls active published route directly from the backend Database.
//   2. Sub-second GPS telemetry emission to dispatchers via WebSockets.
//   3. Live Turn-by-Turn Next Stop Guidance & Direct Google Maps deep-link.
//   4. 250m auto-arrival stop check-off with smooth interpolation.
// ─────────────────────────────────────────────────────────────────────────────

function Driver() {

    // ── Published Route State (Loaded from Backend Database) ───────────────
    const [publishedRoute, setPublishedRoute] = useState(null);
    const [isLoadingRoute, setIsLoadingRoute] = useState(true);

    // ── Driver Progress ───────────────────────────────────────────────────
    const [completedIds, setCompletedIds] = useState(new Set());

    // ── Driver Progress Ref ──────────────────────────────────────────────
    const completedIdsRef = useRef(completedIds);
    useEffect(() => {
        completedIdsRef.current = completedIds;
    }, [completedIds]);

    // ── Real-Time Telemetry & Simulation State ─────────────────────────────
    const [isSimulating, setIsSimulating] = useState(false);
    const [isLiveGps, setIsLiveGps] = useState(false);
    const [driverPosition, setDriverPosition] = useState(null);
    const [driverHeading, setDriverHeading] = useState(0);
    const [driverSpeed, setDriverSpeed] = useState(0);
    const [isDeviated, setIsDeviated] = useState(false);
    const [mobileTab, setMobileTab] = useState("checklist"); // "checklist" | "map"

    const simulationIndexRef = useRef(0);
    const simulationTimerRef = useRef(null);
    const geoWatchIdRef = useRef(null);

    // ── 1. Fetch Active Route from Backend DB on Mount ────────────────────
    useEffect(() => {
        async function loadActiveRoute() {
            try {
                const dbRoute = await fetchPublishedRoute();
                if (dbRoute && dbRoute.stops) {
                    setPublishedRoute(dbRoute);
                    if (dbRoute.depot) {
                        setDriverPosition(dbRoute.depot);
                    }
                }
            } catch (err) {
                console.warn("Could not fetch published route from DB:", err);
            } finally {
                setIsLoadingRoute(false);
            }
        }

        loadActiveRoute();
    }, []);

    // ── 2. Listen for Real-Time Dispatch Broadcasts via WebSockets ────────
    useEffect(() => {
        function handleNewRoute(newRoute) {
            if (newRoute && newRoute.stops) {
                setPublishedRoute(newRoute);
                setCompletedIds(new Set());
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

            // Emit to dispatcher via WebSocket
            socket.emit("driver:stop_completed", {
                stopId,
                isDone,
                completedIds: Array.from(newCompleted)
            });

            return newCompleted;
        });
    }, []);

    // ── Auto-Arrival Proximity Detection (PRD Section 4: 250m Radius) ───────
    const checkAutoArrival = useCallback((currentPos) => {
        if (!publishedRoute?.stops || !currentPos) return;

        const ARRIVAL_RADIUS_KM = 0.25; // 250 meters

        publishedRoute.stops.forEach((stop) => {
            if (!completedIdsRef.current.has(stop.id)) {
                const distKm = calculateDistance(currentPos, stop.position);
                if (distKm <= ARRIVAL_RADIUS_KM) {
                    toggleStopDone(stop.id);
                }
            }
        });
    }, [publishedRoute, toggleStopDone]);

    // ── Telemetry Helper: Heading & Speed ─────────────────────────────────
    function computeHeading(prev, curr) {
        if (!prev || !curr) return 0;
        const dLon = curr[1] - prev[1];
        const dLat = curr[0] - prev[0];
        let deg = (Math.atan2(dLon, dLat) * 180) / Math.PI;
        return deg >= 0 ? deg : deg + 360;
    }

    // ── Simulation Engine ─────────────────────────────────────────────────
    const stopSimulation = useCallback(() => {
        if (simulationTimerRef.current) {
            clearInterval(simulationTimerRef.current);
            simulationTimerRef.current = null;
        }
        setIsSimulating(false);
        socket.emit("driver:status_toggle", { isLive: isLiveGps, isSimulating: false });
    }, [isLiveGps]);

    const startSimulation = useCallback(() => {
        if (!publishedRoute || !publishedRoute.osrmRoute || publishedRoute.osrmRoute.length < 2) {
            alert("No road route polyline available to simulate. Dispatch a route first.");
            return;
        }

        if (isLiveGps) {
            alert("Please stop Browser GPS before starting the drive simulation.");
            return;
        }

        setIsSimulating(true);
        socket.emit("driver:status_toggle", { isLive: false, isSimulating: true });

        const polyline = publishedRoute.osrmRoute;
        simulationIndexRef.current = 0;

        simulationTimerRef.current = setInterval(() => {
            simulationIndexRef.current += 1;

            if (simulationIndexRef.current >= polyline.length) {
                stopSimulation();
                return;
            }

            const prevPos = polyline[simulationIndexRef.current - 1];
            const currPos = polyline[simulationIndexRef.current];
            const heading = computeHeading(prevPos, currPos);
            const speed = Math.floor(25 + Math.random() * 20); // 25-45 km/h

            broadcastTelemetry(currPos, heading, speed, false);
            checkAutoArrival(currPos);

        }, 600); // Step every 600ms
    }, [publishedRoute, isLiveGps, broadcastTelemetry, checkAutoArrival, stopSimulation]);

    // ── HTML5 Geolocation (Real GPS Tracking) ──────────────────────────────
    const stopLiveGps = useCallback(() => {
        if (geoWatchIdRef.current !== null) {
            navigator.geolocation.clearWatch(geoWatchIdRef.current);
            geoWatchIdRef.current = null;
        }
        setIsLiveGps(false);
        socket.emit("driver:status_toggle", { isLive: false, isSimulating });
    }, [isSimulating]);

    const startLiveGps = useCallback(() => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        if (isSimulating) {
            stopSimulation();
        }

        setIsLiveGps(true);
        socket.emit("driver:status_toggle", { isLive: true, isSimulating: false });

        let lastPos = null;

        geoWatchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const currPos = [pos.coords.latitude, pos.coords.longitude];
                const heading = pos.coords.heading || (lastPos ? computeHeading(lastPos, currPos) : 0);
                const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0;

                lastPos = currPos;
                broadcastTelemetry(currPos, heading, speed, false);
                checkAutoArrival(currPos);
            },
            (err) => {
                alert(`GPS Tracking Error: ${err.message}`);
                stopLiveGps();
            },
            {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 5000
            }
        );
    }, [isSimulating, stopSimulation, stopLiveGps, broadcastTelemetry, checkAutoArrival]);

    // ── Trigger Simulated Route Deviation (> 500m Off-Route) ───────────────
    function handleTriggerDeviation() {
        if (!driverPosition) {
            alert("No vehicle location to deviate.");
            return;
        }
        // Offset coordinates by ~0.01 degrees (~1.1 km detour)
        const detourPos = [driverPosition[0] + 0.009, driverPosition[1] + 0.009];
        broadcastTelemetry(detourPos, driverHeading, 35, true);
    }

    // Cleanup timers and GPS watch on unmount
    useEffect(() => {
        return () => {
            if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
            if (geoWatchIdRef.current !== null) navigator.geolocation.clearWatch(geoWatchIdRef.current);
        };
    }, []);

    // ── Derived View Metrics ───────────────────────────────────────────────
    const stops = publishedRoute?.stops || [];
    const depot = publishedRoute?.depot || null;
    const osrmRoute = publishedRoute?.osrmRoute || [];
    const completedCount = completedIds.size;
    const totalCount = stops.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Find next pending stop for Turn-by-Turn Guidance
    const nextPendingStop = stops.find((s) => !completedIds.has(s.id));
    const nextStopDistanceKm = (nextPendingStop && driverPosition)
        ? Math.round(calculateDistance(driverPosition, nextPendingStop.position) * 100) / 100
        : null;

    if (isLoadingRoute) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-57px)] bg-gray-950 text-gray-100">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-gray-400 font-mono">Loading active route from DB...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-57px)] overflow-hidden bg-gray-950 text-gray-100">

            {/* ── MOBILE VIEW TAB SWITCHER ─────────────────────────── */}
            <div className="md:hidden flex bg-gray-900 border-b border-gray-800 p-2 gap-2 flex-shrink-0 z-20">
                <button
                    onClick={() => setMobileTab("checklist")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        mobileTab === "checklist"
                            ? "bg-emerald-600 text-white shadow"
                            : "bg-gray-800 text-gray-400"
                    }`}
                >
                    📋 Stops Checklist ({completedCount}/{totalCount})
                </button>
                <button
                    onClick={() => setMobileTab("map")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        mobileTab === "map"
                            ? "bg-emerald-600 text-white shadow"
                            : "bg-gray-800 text-gray-400"
                    }`}
                >
                    🗺️ Turn-by-Turn Map
                </button>
            </div>

            {/* ── SIDEBAR: TURN-BY-TURN & STOP CHECKLIST ───────────── */}
            <aside className={`w-full md:w-96 flex flex-col bg-gray-900 border-r border-gray-800 overflow-y-auto flex-shrink-0 ${
                mobileTab === "map" ? "hidden md:flex" : "flex"
            }`}>

                {/* Driver Header */}
                <div className="px-4 py-3.5 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
                    <div>
                        <h1 className="text-white font-extrabold text-base tracking-tight flex items-center gap-1.5">
                            <span>🚚</span> Driver Console
                        </h1>
                        <p className="text-gray-400 text-xs mt-0.5">
                            Real-Time Indian Route Navigation & Telemetry
                        </p>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        DB Synced
                    </span>
                </div>

                {/* ── NEXT STOP GUIDANCE HERO CARD ── */}
                {nextPendingStop && (
                    <div className="m-4 p-4 rounded-2xl bg-gradient-to-br from-blue-950/80 to-indigo-950/80 border border-blue-600/50 shadow-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                                <span>🎯</span> Next Delivery Target
                            </span>
                            {nextPendingStop.priority === "urgent" && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-red-600/30 text-red-300 border border-red-500/50 animate-pulse">
                                    ⚡ URGENT
                                </span>
                            )}
                        </div>

                        <div>
                            <h2 className="text-lg font-black text-white leading-tight">
                                {nextPendingStop.name}
                            </h2>
                            <p className="text-xs font-mono text-gray-400 mt-1">
                                {nextPendingStop.position[0].toFixed(5)}, {nextPendingStop.position[1].toFixed(5)}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-blue-800/40 text-xs">
                            <span className="text-gray-300">
                                Distance: <strong className="text-white font-mono">{nextStopDistanceKm !== null ? `${nextStopDistanceKm} km` : "Approaching"}</strong>
                            </span>
                            <span className="text-emerald-400 font-bold text-[11px]">
                                📍 Auto-arrives within 250m
                            </span>
                        </div>

                        {/* Direct Google Maps Deep-link */}
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${nextPendingStop.position[0]},${nextPendingStop.position[1]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20"
                        >
                            <span>🗺️</span>
                            <span>Open in Google Maps</span>
                        </a>
                    </div>
                )}

                {/* ── OVERALL PROGRESS BAR ── */}
                <div className="px-4 py-3 bg-gray-950/60 border-y border-gray-800 space-y-1.5">
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-400 font-semibold">Route Completion</span>
                        <span className="text-emerald-400 font-bold font-mono">
                            {completedCount} / {totalCount} Stops ({progressPercent}%)
                        </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* ── TELEMETRY & SIMULATION CONTROLS ── */}
                <div className="p-4 bg-gray-950/40 border-b border-gray-800 space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        📡 Telemetry & Simulation Controls
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                        {/* Simulation Toggle */}
                        <button
                            onClick={isSimulating ? stopSimulation : startSimulation}
                            disabled={!publishedRoute}
                            className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                isSimulating
                                    ? "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 animate-pulse"
                                    : "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700"
                            }`}
                        >
                            <span>{isSimulating ? "⏹️ Stop Drive Sim" : "▶️ Simulate Drive"}</span>
                        </button>

                        {/* Live GPS Toggle */}
                        <button
                            onClick={isLiveGps ? stopLiveGps : startLiveGps}
                            className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                isLiveGps
                                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 animate-pulse"
                                    : "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700"
                            }`}
                        >
                            <span>{isLiveGps ? "🟢 Stop GPS" : "📡 Browser GPS"}</span>
                        </button>
                    </div>

                    {/* Trigger Simulated Deviation Detour */}
                    {driverPosition && (
                        <button
                            onClick={handleTriggerDeviation}
                            className="w-full py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 font-semibold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <span>⚠️</span>
                            <span>Simulate Route Deviation Detour (&gt;500m)</span>
                        </button>
                    )}
                </div>

                {/* ── STOPS CHECKLIST ── */}
                <div className="p-4 space-y-2 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                        📦 Delivery Sequence Checklist
                    </span>

                    {stops.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-xs space-y-2">
                            <span className="text-3xl block">📋</span>
                            <p>No active delivery route published.</p>
                            <p className="text-[11px] text-gray-600">The dispatcher will publish an optimized tour here.</p>
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {stops.map((stop, index) => {
                                const isDone = completedIds.has(stop.id);
                                const isNext = !isDone && nextPendingStop?.id === stop.id;

                                return (
                                    <li
                                        key={stop.id}
                                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                                            isDone
                                                ? "bg-emerald-950/20 border-emerald-800/40 text-gray-500 opacity-60"
                                                : isNext
                                                ? "bg-blue-950/40 border-blue-500/80 text-white shadow-md shadow-blue-900/20"
                                                : "bg-gray-950/50 border-gray-800 text-gray-300"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <button
                                                onClick={() => toggleStopDone(stop.id)}
                                                className={`w-6 h-6 rounded-lg border flex items-center justify-center font-bold text-xs transition-colors cursor-pointer flex-shrink-0 ${
                                                    isDone
                                                        ? "bg-emerald-600 border-emerald-500 text-white"
                                                        : "bg-gray-900 border-gray-700 text-transparent hover:border-blue-500"
                                                }`}
                                            >
                                                ✓
                                            </button>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-bold text-gray-400 font-mono">
                                                        #{index + 1}
                                                    </span>
                                                    <span className={`text-xs font-bold truncate ${isDone ? "line-through text-gray-500" : "text-white"}`}>
                                                        {stop.name}
                                                    </span>
                                                    {stop.priority === "urgent" && (
                                                        <span className="text-[10px]">⚡</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] font-mono text-gray-500">
                                                    {stop.position[0].toFixed(4)}, {stop.position[1].toFixed(4)}
                                                </p>
                                            </div>
                                        </div>

                                        {isDone ? (
                                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                                                Delivered
                                            </span>
                                        ) : isNext ? (
                                            <span className="text-[10px] font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-700/60 animate-pulse">
                                                Next Stop
                                            </span>
                                        ) : null}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

            </aside>

            {/* ── MAP VIEW ─────────────────────────────────────────── */}
            <main className={`flex-1 flex flex-col relative ${
                mobileTab === "checklist" ? "hidden md:flex" : "flex"
            }`}>

                {/* Telemetry HUD Badge */}
                <div className="absolute top-4 left-4 z-[999] bg-gray-900/90 border border-gray-700/80 rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs">
                    <span className="text-xl">🚚</span>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white">Speed: {driverSpeed} km/h</span>
                            <span className="text-gray-500">•</span>
                            <span className="font-mono text-gray-300">Heading: {Math.round(driverHeading)}°</span>
                        </div>
                        <p className={`text-[11px] font-semibold ${isDeviated ? "text-red-400" : "text-emerald-400"}`}>
                            {isDeviated ? "⚠️ Off Route (&gt;500m Detour)" : "🟢 GPS Telemetry Active"}
                        </p>
                    </div>
                </div>

                {/* Leaflet Map */}
                <MapView
                    stops={stops}
                    depot={depot}
                    routePositions={osrmRoute}
                    driverPosition={driverPosition}
                    driverHeading={driverHeading}
                    isDeviated={isDeviated}
                    completedStopIds={completedIds}
                />

            </main>

        </div>
    );
}

export default Driver;