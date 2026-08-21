import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import StopList from "../components/StopList";
import AddStopForm from "../components/AddStopForm";
import RouteSummary from "../components/RouteSummary";
import AlgorithmBenchmark from "../components/AlgorithmBenchmark";
import AlgorithmVisualizer from "../components/AlgorithmVisualizer";
import ManifestModal from "../components/ManifestModal";
import { optimizeRouteWithRoadNetwork, optimizeRouteWithBenchmark } from "../utils/optimizeRoute";
import { socket } from "../services/socket";
import { publishRoute } from "../services/api";
import { checkRouteDeviation } from "../utils/deviation";
import { CITY_PRESETS } from "../data/cityPresets";

// ─── Dispatcher Page ────────────────────────────────────────────────────────
//
// WHO USES THIS:
//   The dispatcher — the person in the office who plans deliveries.
//
// ENHANCED PORTFOLIO FEATURES:
//   1. Global City Presets & Browser Geolocation Auto-Detection.
//   2. Mobile-responsive split view with Map vs Panel toggle.
//   3. Stop Priority Tagging (Urgent ⚡ vs Standard vs Flexible).
//   4. Green Logistics / ESG Carbon & Fuel savings calculation.
//   5. One-Click CSV Delivery Manifest Exporter.
//   6. Real-time WebSocket Driver Tracking & Automated Deviation Re-Routing.
// ───────────────────────────────────────────────────────────────────────────

function Dispatcher() {

    const navigate = useNavigate();

    // ── Form inputs ──────────────────────────────────────────────────────
    const [name, setName] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [priority, setPriority] = useState("standard");

    // ── Stops & Depot (Defaulting to NYC Preset) ───────────────────────────
    const [stops, setStops] = useState(() => {
        const saved = localStorage.getItem("dispatcher_stops");
        return saved ? JSON.parse(saved) : CITY_PRESETS[0].stops;
    });

    const [depot, setDepot] = useState(() => {
        const saved = localStorage.getItem("dispatcher_depot");
        return saved ? JSON.parse(saved) : CITY_PRESETS[0].depot;
    });

    const [selectedCityId, setSelectedCityId] = useState("nyc");

    // ── Modes / UI state ─────────────────────────────────────────────────
    const [isDepotMode, setIsDepotMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [mobileTab, setMobileTab] = useState("panel"); // "panel" | "map"

    // ── Optimization & Algorithm state ───────────────────────────────────
    const [optimizedStops, setOptimizedStops] = useState([]);
    const [hasOptimized, setHasOptimized] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [benchmarkData, setBenchmarkData] = useState(null);
    
    // ── Visualizer state ──────────────────────────────────────────────────
    const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
    const [visualizerRoutePositions, setVisualizerRoutePositions] = useState(null);

    // ── Manifest Modal state ─────────────────────────────────────────────
    const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);

    // ── Road polyline state ───────────────────────────────────────────────
    const [osrmRoute, setOsrmRoute] = useState([]);
    const [osrmDistance, setOsrmDistance] = useState(0);

    // ── Real-Time Driver Telemetry & WebSocket State ──────────────────────
    const [driverTelemetry, setDriverTelemetry] = useState(null);
    const [completedStopIds, setCompletedStopIds] = useState(new Set());
    const [deviationState, setDeviationState] = useState({ isDeviated: false, distanceMeters: 0 });

    // ── Publish state ─────────────────────────────────────────────────────
    const [isPublished, setIsPublished] = useState(false);


    // ── WebSocket Telemetry & Progress Listeners (Phase 3) ────────────────
    useEffect(() => {
        function handleDriverMoved(telemetry) {
            setDriverTelemetry(telemetry);

            if (telemetry?.position && osrmRoute.length > 1) {
                const deviation = checkRouteDeviation(telemetry.position, osrmRoute, 500);
                const isOffRoute = deviation.isDeviated || telemetry.isDeviated;
                setDeviationState({
                    isDeviated: isOffRoute,
                    distanceMeters: isOffRoute ? Math.max(deviation.distanceMeters, 750) : deviation.distanceMeters
                });
            }
        }

        function handleStopUpdated({ completedIds }) {
            if (completedIds) {
                setCompletedStopIds(new Set(completedIds));
            }
        }

        function handleDriverStatus({ isLive, isSimulating }) {
            setDriverTelemetry((prev) => prev ? { ...prev, isLive, isSimulating } : { isLive, isSimulating });
        }

        socket.on("dispatcher:driver_moved", handleDriverMoved);
        socket.on("dispatcher:stop_updated", handleStopUpdated);
        socket.on("dispatcher:driver_status", handleDriverStatus);

        return () => {
            socket.off("dispatcher:driver_moved", handleDriverMoved);
            socket.off("dispatcher:stop_updated", handleStopUpdated);
            socket.off("dispatcher:driver_status", handleDriverStatus);
        };
    }, [osrmRoute]);


    // ── Persist dispatcher's own stops + depot ───────────────────────────
    useEffect(() => {
        localStorage.setItem("dispatcher_stops", JSON.stringify(stops));
    }, [stops]);

    useEffect(() => {
        if (depot !== null) {
            localStorage.setItem("dispatcher_depot", JSON.stringify(depot));
        }
    }, [depot]);


    // ── resetRoute ───────────────────────────────────────────────────────
    function resetRoute() {
        setOptimizedStops([]);
        setHasOptimized(false);
        setIsPublished(false);
        setBenchmarkData(null);
        setIsVisualizerOpen(false);
        setVisualizerRoutePositions(null);
        setOsrmRoute([]);
        setOsrmDistance(0);
        setDeviationState({ isDeviated: false, distanceMeters: 0 });
    }


    // ── City Preset Switcher ──────────────────────────────────────────────
    function handleSelectCityPreset(cityId) {
        setSelectedCityId(cityId);
        const preset = CITY_PRESETS.find((c) => c.id === cityId);
        if (preset) {
            setDepot(preset.depot);
            setStops(preset.stops);
            resetRoute();
        }
    }

    // ── Detect User Location ──────────────────────────────────────────────
    function handleDetectMyLocation() {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const userPos = [pos.coords.latitude, pos.coords.longitude];
                setDepot(userPos);
                setSelectedPosition(userPos);
                setSelectedCityId("custom");
                resetRoute();
                alert(`📍 Depot set to your current location:\n${userPos[0].toFixed(4)}, ${userPos[1].toFixed(4)}`);
            },
            (err) => {
                alert(`Could not retrieve location: ${err.message}`);
            },
            { enableHighAccuracy: true }
        );
    }

    // ── Clear All Data (Blank Canvas) ─────────────────────────────────────
    function handleClearAll() {
        if (window.confirm("Clear all stops and depot to start with a blank canvas?")) {
            setDepot(null);
            setStops([]);
            setSelectedCityId("custom");
            resetRoute();
            localStorage.removeItem("dispatcher_stops");
            localStorage.removeItem("dispatcher_depot");
        }
    }


    // ── handleMapClick ───────────────────────────────────────────────────
    function handleMapClick(e) {
        const { lat, lng } = e.latlng;
        if (isDepotMode) {
            setDepot([lat, lng]);
            setIsDepotMode(false);
            resetRoute();
        } else {
            setLatitude(lat.toFixed(6));
            setLongitude(lng.toFixed(6));
            setSelectedPosition([lat, lng]);
        }
    }

    // ── handleAddStop ────────────────────────────────────────────────────
    function handleAddStop() {
        if (editingId === null) {
            const newStop = {
                id: Date.now(),
                name,
                position: [Number(latitude), Number(longitude)],
                priority
            };
            setStops([...stops, newStop]);
        } else {
            setStops(stops.map((s) =>
                s.id === editingId
                    ? { id: s.id, name, position: [Number(latitude), Number(longitude)], priority }
                    : s
            ));
            setEditingId(null);
        }
        setName(""); setLatitude(""); setLongitude(""); setPriority("standard");
        setSelectedPosition(null);
        resetRoute();
    }

    function handleDeleteStop(id) {
        setStops(stops.filter((s) => s.id !== id));
        resetRoute();
    }

    function handleEditStop(stop) {
        setEditingId(stop.id);
        setName(stop.name);
        setLatitude(stop.position[0]);
        setLongitude(stop.position[1]);
        setPriority(stop.priority || "standard");
    }

    function handleCancelEdit() {
        setEditingId(null);
        setName(""); setLatitude(""); setLongitude(""); setPriority("standard");
        setSelectedPosition(null);
    }

    // ── executeOptimization (Matrix-Driven Road Network NN + 2-Opt) ─────────
    const executeOptimization = useCallback(async (stopsToOptimize, startPoint) => {
        if (!startPoint || stopsToOptimize.length === 0) return;

        setIsOptimizing(true);
        setIsVisualizerOpen(false);
        setVisualizerRoutePositions(null);
        
        try {
            const roadResult = await optimizeRouteWithRoadNetwork(stopsToOptimize, startPoint);
            
            setBenchmarkData(roadResult.benchmark);
            setOptimizedStops(roadResult.orderedStops);
            setOsrmRoute(roadResult.routePositions);
            setOsrmDistance(roadResult.distance);
            
            setHasOptimized(true);
            setIsPublished(false);
            setDeviationState({ isDeviated: false, distanceMeters: 0 });
            
        } catch(err) {
            console.warn("Road network optimization fallback to synchronous solver:", err);
            const benchmark = optimizeRouteWithBenchmark(stopsToOptimize, startPoint);
            setBenchmarkData(benchmark);
            setOptimizedStops(benchmark.finalRoute);
            const returnDepot = depot || startPoint;
            const orderedWaypoints = [startPoint, ...benchmark.finalRoute.map(s => s.position), returnDepot];
            setOsrmRoute(orderedWaypoints);
            setOsrmDistance(benchmark.twoOptDistance);
            setHasOptimized(true);
        } finally {
            setIsOptimizing(false);
        }
    }, [depot]);

    async function handleOptimize() {
        if (!depot) {
            alert("Please set a depot first.\n\nClick '🏭 Set Depot', or select a City Preset.");
            return;
        }
        if (stops.length === 0) {
            alert("Please add at least one delivery stop.");
            return;
        }
        await executeOptimization(stops, depot);
    }

    // ── One-Click Re-Optimization from Live Driver Location (Phase 4) ─────
    async function handleReoptimizeFromDriver() {
        if (!driverTelemetry?.position) {
            alert("No live driver position available for re-routing.");
            return;
        }

        const remainingStops = stops.filter(s => !completedStopIds.has(s.id));
        if (remainingStops.length === 0) {
            alert("All stops are already completed!");
            return;
        }

        await executeOptimization(remainingStops, driverTelemetry.position);

        const routePayload = {
            depot: depot,
            stops: remainingStops,
            osrmRoute: osrmRoute,
            osrmDistance: osrmDistance,
            benchmark: benchmarkData,
            publishedAt: new Date().toLocaleString() + " (Re-Optimized)"
        };

        await publishRoute(routePayload);
        setIsPublished(true);
        setDeviationState({ isDeviated: false, distanceMeters: 0 });
    }

    function handleResetRoute() {
        resetRoute();
    }

    // ── handleVisualizerStepSelect ─────────────────────────────────────────
    function handleVisualizerStepSelect(step) {
        if (!step || !step.route) return;
        const stepPositions = [depot, ...step.route.map(s => s.position), depot];
        setVisualizerRoutePositions(stepPositions);
    }

    function handleCloseVisualizer() {
        setIsVisualizerOpen(false);
        setVisualizerRoutePositions(null);
    }

    // ── handlePublish (REST API + WebSockets) ─────────────────────────────
    async function handlePublish() {
        if (!hasOptimized) {
            alert("Please optimize the route first before publishing.");
            return;
        }

        const routePayload = {
            depot: depot,
            stops: optimizedStops,
            osrmRoute: osrmRoute,
            osrmDistance: osrmDistance,
            benchmark: benchmarkData,
            publishedAt: new Date().toLocaleString()
        };

        await publishRoute(routePayload);
        setIsPublished(true);
    }


    const activeRoutePositions = visualizerRoutePositions || osrmRoute;
    const completedCount = completedStopIds.size;
    const totalCount = optimizedStops.length || stops.length;


    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-57px)] overflow-hidden bg-gray-950 text-gray-100">

            {/* ── MOBILE VIEW TAB SWITCHER ─────────────────────────── */}
            <div className="md:hidden flex bg-gray-900 border-b border-gray-800 p-2 gap-2 flex-shrink-0 z-20">
                <button
                    onClick={() => setMobileTab("panel")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        mobileTab === "panel"
                            ? "bg-blue-600 text-white shadow"
                            : "bg-gray-800 text-gray-400"
                    }`}
                >
                    📋 Control Panel ({stops.length} Stops)
                </button>
                <button
                    onClick={() => setMobileTab("map")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        mobileTab === "map"
                            ? "bg-blue-600 text-white shadow"
                            : "bg-gray-800 text-gray-400"
                    }`}
                >
                    🗺️ Live Map
                </button>
            </div>

            {/* ── SIDEBAR (Hidden on mobile if map is active) ────── */}
            <aside className={`w-full md:w-96 flex flex-col bg-gray-900 border-r border-gray-800 overflow-y-auto flex-shrink-0 ${
                mobileTab === "map" ? "hidden md:flex" : "flex"
            }`}>

                {/* Header */}
                <div className="px-4 py-3.5 bg-gray-950 border-b border-gray-800 flex items-center justify-between">
                    <div>
                        <h1 className="text-white font-extrabold text-base tracking-tight flex items-center gap-1.5">
                            <span>📋</span> Dispatcher Control
                        </h1>
                        <p className="text-gray-400 text-xs mt-0.5">
                            Plan, sequence & dispatch fleets
                        </p>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        Live Hub
                    </span>
                </div>

                {/* ── GLOBAL CITY PRESETS & GEOLOCATION ── */}
                <div className="px-4 py-3 bg-gray-950/60 border-b border-gray-800 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                            🌍 Global City Presets
                        </span>
                        <button
                            onClick={handleDetectMyLocation}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
                        >
                            📍 My Location
                        </button>
                    </div>

                    {/* Presets Grid */}
                    <div className="grid grid-cols-3 gap-1.5">
                        {CITY_PRESETS.map((city) => (
                            <button
                                key={city.id}
                                onClick={() => handleSelectCityPreset(city.id)}
                                className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border transition-all truncate cursor-pointer ${
                                    selectedCityId === city.id
                                        ? "bg-blue-600/30 border-blue-500 text-blue-300 font-bold"
                                        : "bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800"
                                }`}
                            >
                                {city.name}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-1 text-[11px]">
                        <span className="text-gray-500">Or click map to set depot & stops</span>
                        <button
                            onClick={handleClearAll}
                            className="text-red-400 hover:text-red-300 cursor-pointer font-medium"
                        >
                            🧹 Clear Canvas
                        </button>
                    </div>
                </div>

                {/* ── LIVE DRIVER TELEMETRY CARD ── */}
                {driverTelemetry?.position && (
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-950/90 to-indigo-950/90 border-b border-blue-900/60 text-white space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                🚚 Live Driver Telemetry
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-800/60 text-blue-200">
                                {driverTelemetry.speed || 0} km/h
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-gray-300">
                            <div>
                                <span className="text-gray-400 text-[10px] block">Progress:</span>
                                <strong>{completedCount} / {totalCount} Done</strong>
                            </div>
                            <div>
                                <span className="text-gray-400 text-[10px] block">Heading:</span>
                                <strong>{driverTelemetry.heading || 0}°</strong>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── DEPOT CONTROLS ── */}
                <div className="px-4 py-3 border-b border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                            Depot Hub
                        </p>
                        {depot && (
                            <span className="text-[11px] font-mono text-gray-400">
                                {depot[0].toFixed(4)}, {depot[1].toFixed(4)}
                            </span>
                        )}
                    </div>
                    
                    <button
                        onClick={() => setIsDepotMode((prev) => !prev)}
                        className={`w-full py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isDepotMode
                                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20"
                                : "bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20"
                        }`}
                    >
                        <span>🏭</span>
                        <span>{isDepotMode ? "Click map to place Depot..." : "Set / Reposition Depot"}</span>
                    </button>
                </div>

                {/* ── ADD / EDIT STOP FORM ── */}
                <div className="px-4 py-3 border-b border-gray-800">
                    <AddStopForm
                        name={name}
                        latitude={latitude}
                        longitude={longitude}
                        priority={priority}
                        setName={setName}
                        setLatitude={setLatitude}
                        setLongitude={setLongitude}
                        setPriority={setPriority}
                        onAddStop={handleAddStop}
                        onCancelEdit={handleCancelEdit}
                        editingId={editingId}
                        onLocationSelect={setSelectedPosition}
                    />
                </div>

                {/* ── STOP LIST ── */}
                <div className="px-4 py-3 border-b border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                            Stops Queue ({stops.length})
                        </p>
                        {stops.length > 0 && (
                            <button
                                onClick={() => setIsManifestModalOpen(true)}
                                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer flex items-center gap-1"
                            >
                                <span>📄</span>
                                <span>Export Manifest</span>
                            </button>
                        )}
                    </div>
                    <StopList
                        stops={stops}
                        onDelete={handleDeleteStop}
                        onEdit={handleEditStop}
                    />
                </div>

                {/* ── OPTIMIZATION CONTROLS ── */}
                <div className="px-4 py-3.5 border-b border-gray-800 space-y-2.5">
                    <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                        Algorithm Engine (NN + 2-Opt)
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleOptimize}
                            disabled={isOptimizing}
                            className={`flex-1 py-2.5 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                isOptimizing
                                    ? "bg-gray-700 cursor-not-allowed text-gray-400"
                                    : "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30"
                            }`}
                        >
                            <span>⚡</span>
                            <span>{isOptimizing ? "Optimizing..." : "Optimize Route"}</span>
                        </button>
                        {hasOptimized && (
                            <button
                                onClick={handleResetRoute}
                                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* ── ALGORITHM BENCHMARK & ESG ECO PANEL ── */}
                {hasOptimized && benchmarkData && (
                    <div className="px-4 py-3.5 border-b border-gray-800">
                        <AlgorithmBenchmark
                            benchmarkData={benchmarkData}
                            onOpenVisualizer={() => setIsVisualizerOpen(true)}
                        />
                    </div>
                )}

                {/* ── PUBLISH ROUTE ── */}
                {hasOptimized && (
                    <div className="px-4 py-3.5 border-b border-gray-800 space-y-2.5">
                        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                            Fleet Dispatch
                        </p>

                        {isPublished ? (
                            <div className="space-y-2">
                                <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-xl p-3">
                                    <p className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                                        <span>✅</span> Route Broadcast to Driver Live!
                                    </p>
                                    <p className="text-[11px] text-emerald-400/80 mt-1">
                                        Driver client is now synchronized via WebSocket telemetry.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate("/driver")}
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <span>🚚</span>
                                    <span>Switch to Driver Live View</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handlePublish}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <span>📤</span>
                                <span>Publish Route to Driver</span>
                            </button>
                        )}
                    </div>
                )}

                {/* ── ROUTE SUMMARY ── */}
                {hasOptimized && (
                    <div className="px-4 py-3.5">
                        <RouteSummary
                            depot={depot}
                            optimizedStops={optimizedStops}
                            totalDistance={osrmDistance}
                        />
                    </div>
                )}

            </aside>

            {/* ── MAP CONTAINER (Full width on mobile when map tab is active) ── */}
            <div className={`flex-1 h-full relative ${
                mobileTab === "panel" ? "hidden md:block" : "block"
            }`}>
                
                {/* ── ROUTE DEVIATION ALERT BANNER ── */}
                {deviationState.isDeviated && (
                    <div className="absolute top-4 left-4 right-4 z-[1000] max-w-lg mx-auto bg-rose-600 text-white px-4 py-3 rounded-xl shadow-2xl border border-rose-400 flex items-center justify-between animate-bounce">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">⚠️</span>
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wide">
                                    Driver Off-Route Detected!
                                </h4>
                                <p className="text-[11px] text-rose-100">
                                    Vehicle is ~{deviationState.distanceMeters}m off scheduled polyline.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleReoptimizeFromDriver}
                            className="px-3 py-1.5 bg-white text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-lg shadow transition-all cursor-pointer whitespace-nowrap"
                        >
                            ⚡ Re-Optimize
                        </button>
                    </div>
                )}

                {/* Visualizer Floating Overlay */}
                {isVisualizerOpen && benchmarkData?.steps && (
                    <AlgorithmVisualizer
                        steps={benchmarkData.steps}
                        onClose={handleCloseVisualizer}
                        onStepSelect={handleVisualizerStepSelect}
                    />
                )}

                {/* Depot Mode Overlay Banner */}
                {isDepotMode && (
                    <div className="absolute top-0 left-0 right-0 z-[1000] bg-amber-500 text-white text-center text-xs py-2 font-bold shadow-lg">
                        🏭 Depot mode active — click anywhere on the map to place your depot hub
                        <button
                            onClick={() => setIsDepotMode(false)}
                            className="ml-3 underline hover:no-underline text-amber-100 cursor-pointer font-semibold"
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
                    routePositions={activeRoutePositions}
                    driverPosition={driverTelemetry?.position}
                    driverHeading={driverTelemetry?.heading || 0}
                    isDeviated={deviationState.isDeviated}
                />
            </div>

            {/* Delivery Manifest Modal */}
            <ManifestModal
                isOpen={isManifestModalOpen}
                onClose={() => setIsManifestModalOpen(false)}
                stops={hasOptimized && optimizedStops.length > 0 ? optimizedStops : stops}
                depot={depot}
                totalDistance={osrmDistance}
                benchmarkData={benchmarkData}
                completedIds={completedStopIds}
            />

        </div>
    );
}

export default Dispatcher;