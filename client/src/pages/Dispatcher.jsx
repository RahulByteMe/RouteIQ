import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import StopList from "../components/StopList";
import AddStopForm from "../components/AddStopForm";
import RouteSummary from "../components/RouteSummary";
import AlgorithmBenchmark from "../components/AlgorithmBenchmark";
import AlgorithmVisualizer from "../components/AlgorithmVisualizer";
import ManifestModal from "../components/ManifestModal";
import DraggableWidget from "../components/DraggableWidget";
import { optimizeRouteWithRoadNetwork, optimizeRouteWithBenchmark } from "../utils/optimizeRoute";
import { socket } from "../services/socket";
import {
    fetchStops,
    fetchDepot,
    createStop,
    deleteStop,
    saveBatchStops,
    saveDepot,
    publishRoute
} from "../services/api";
import { checkRouteDeviation } from "../utils/deviation";
import { CITY_PRESETS } from "../data/cityPresets";

// ─── Dispatcher Page (India Logistics Hub with Draggable Overlays) ───────────

function Dispatcher() {
    const navigate = useNavigate();

    // ── Form inputs ──────────────────────────────────────────────────────
    const [name, setName] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [priority, setPriority] = useState("standard");

    // ── Stops & Depot (Synced with Backend DB) ────────────────────────────
    const [stops, setStops] = useState(CITY_PRESETS[0].stops);
    const [depot, setDepot] = useState(CITY_PRESETS[0].depot);
    const [selectedCityId, setSelectedCityId] = useState("delhi");

    // ── Modes / UI state ─────────────────────────────────────────────────
    const [isDepotMode, setIsDepotMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [mobileTab, setMobileTab] = useState("panel"); // "panel" | "map"

    // ── Floating HUD Overlays Management ──────────────────────────────────
    const [showSummaryWidget, setShowSummaryWidget] = useState(true);
    const [showBenchmarkWidget, setShowBenchmarkWidget] = useState(true);
    const [showAllOverlays, setShowAllOverlays] = useState(true);

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

    // ── Fetch Initial Data from Backend Database ─────────────────────────
    useEffect(() => {
        async function loadInitialData() {
            try {
                const [dbStops, dbDepot] = await Promise.all([fetchStops(), fetchDepot()]);
                if (dbStops && Array.isArray(dbStops) && dbStops.length > 0) {
                    setStops(dbStops);
                } else {
                    setStops(CITY_PRESETS[0].stops);
                }

                if (dbDepot && Array.isArray(dbDepot) && dbDepot.length === 2) {
                    setDepot(dbDepot);
                } else {
                    setDepot(CITY_PRESETS[0].depot);
                }
            } catch (err) {
                console.warn("Could not load stops/depot from backend database:", err);
                setStops(CITY_PRESETS[0].stops);
                setDepot(CITY_PRESETS[0].depot);
            }
        }

        loadInitialData();
    }, []);

    // ── WebSocket Telemetry & Progress Listeners ───────────────────────────
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

    // ── Indian City Preset Switcher (Saves to DB) ──────────────────────────
    async function handleSelectCityPreset(cityId) {
        setSelectedCityId(cityId);
        const preset = CITY_PRESETS.find((c) => c.id === cityId);
        if (preset) {
            setDepot(preset.depot);
            setStops(preset.stops);
            resetRoute();
            await Promise.all([
                saveDepot(preset.depot),
                saveBatchStops(preset.stops)
            ]);
        }
    }

    // ── Detect User Location (GPS) ─────────────────────────────────────────
    async function handleDetectMyLocation() {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const userPos = [pos.coords.latitude, pos.coords.longitude];
                setDepot(userPos);
                setSelectedPosition(userPos);
                setSelectedCityId("custom");
                resetRoute();
                await saveDepot(userPos);
                alert(`📍 Depot updated in DB to your current location:\n${userPos[0].toFixed(4)}, ${userPos[1].toFixed(4)}`);
            },
            (err) => {
                alert(`Could not retrieve location: ${err.message}`);
            },
            { enableHighAccuracy: true }
        );
    }

    // ── Clear All Data (Blank Canvas) ─────────────────────────────────────
    async function handleClearAll() {
        if (window.confirm("Clear all stops and depot to start with a blank canvas?")) {
            setDepot(null);
            setStops([]);
            setSelectedCityId("custom");
            resetRoute();
            await saveBatchStops([]);
        }
    }

    // ── handleMapClick ───────────────────────────────────────────────────
    async function handleMapClick(e) {
        const { lat, lng } = e.latlng;
        if (isDepotMode) {
            const newDepot = [lat, lng];
            setDepot(newDepot);
            setIsDepotMode(false);
            resetRoute();
            await saveDepot(newDepot);
        } else {
            setLatitude(lat.toFixed(6));
            setLongitude(lng.toFixed(6));
            setSelectedPosition([lat, lng]);
        }
    }

    // ── handleAddStop (Direct DB Persistence) ─────────────────────────────
    async function handleAddStop() {
        if (editingId === null) {
            const newStopPayload = {
                name,
                position: [Number(latitude), Number(longitude)],
                priority
            };
            const created = await createStop(newStopPayload);
            setStops((prev) => [...prev, created]);
        } else {
            const updatedStops = stops.map((s) =>
                s.id === editingId
                    ? { id: s.id, name, position: [Number(latitude), Number(longitude)], priority }
                    : s
            );
            setStops(updatedStops);
            await saveBatchStops(updatedStops);
            setEditingId(null);
        }
        setName(""); setLatitude(""); setLongitude(""); setPriority("standard");
        setSelectedPosition(null);
        resetRoute();
    }

    async function handleDeleteStop(id) {
        await deleteStop(id);
        setStops((prev) => prev.filter((s) => s.id !== id));
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
            setShowSummaryWidget(true);
            setShowBenchmarkWidget(true);
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
            setShowSummaryWidget(true);
            setShowBenchmarkWidget(true);
        } finally {
            setIsOptimizing(false);
        }
    }, [depot]);

    async function handleOptimize() {
        if (!depot) {
            alert("Please set an Indian depot first.\n\nClick '🏭 Set Depot', or select an Indian City Preset.");
            return;
        }
        if (stops.length === 0) {
            alert("Please add at least one delivery stop.");
            return;
        }
        await executeOptimization(stops, depot);
    }

    // ── One-Click Re-Optimization from Live Driver Location ────────────────
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
            publishedAt: new Date().toLocaleString()
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

    // ── handlePublish (Persist to PostgreSQL DB & Broadcast via WS) ────────
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
                            <span>📋</span> Dispatcher Hub
                        </h1>
                        <p className="text-gray-400 text-xs mt-0.5">
                            Indian Logistics & Multi-Stop Dispatch
                        </p>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        DB Synced
                    </span>
                </div>

                {/* ── INDIAN METROPOLITAN HUBS ── */}
                <div className="px-4 py-3 bg-gray-950/60 border-b border-gray-800 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                            🇮🇳 Indian Metropolitan Hubs
                        </span>
                        <button
                            onClick={handleDetectMyLocation}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
                        >
                            📍 My GPS
                        </button>
                    </div>

                    {/* Presets Grid */}
                    <div className="grid grid-cols-2 gap-1.5">
                        {CITY_PRESETS.map((city) => (
                            <button
                                key={city.id}
                                onClick={() => handleSelectCityPreset(city.id)}
                                className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border transition-all truncate cursor-pointer text-left ${
                                    selectedCityId === city.id
                                        ? "bg-blue-600/30 border-blue-500 text-blue-300 font-bold shadow-sm"
                                        : "bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800"
                                }`}
                            >
                                {city.name}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-1 text-[11px]">
                        <span className="text-gray-500">Click map to set custom Indian stops</span>
                        <button
                            onClick={handleClearAll}
                            className="text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                        >
                            Clear All
                        </button>
                    </div>
                </div>

                {/* Depot section */}
                <div className="px-4 py-3 bg-gray-950/40 border-b border-gray-800 flex items-center justify-between">
                    <div className="text-xs">
                        <span className="text-gray-400">Depot Hub: </span>
                        {depot ? (
                            <span className="text-emerald-400 font-mono font-semibold">
                                {depot[0].toFixed(4)}, {depot[1].toFixed(4)}
                            </span>
                        ) : (
                            <span className="text-amber-400 font-semibold">Not Set</span>
                        )}
                    </div>
                    <button
                        onClick={() => setIsDepotMode(!isDepotMode)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                            isDepotMode
                                ? "bg-amber-600 border-amber-500 text-white animate-pulse"
                                : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                        }`}
                    >
                        {isDepotMode ? "Click Map to Set Hub" : "🏭 Set Depot"}
                    </button>
                </div>

                {/* Add / Edit stop form */}
                <AddStopForm
                    name={name}
                    setName={setName}
                    latitude={latitude}
                    setLatitude={setLatitude}
                    longitude={longitude}
                    setLongitude={setLongitude}
                    priority={priority}
                    setPriority={setPriority}
                    editingId={editingId}
                    onAddStop={handleAddStop}
                    onCancelEdit={handleCancelEdit}
                />

                {/* Stops list */}
                <StopList
                    stops={stops}
                    onEditStop={handleEditStop}
                    onDeleteStop={handleDeleteStop}
                />

                {/* Dispatch / Optimization actions */}
                <div className="p-4 bg-gray-950/90 border-t border-gray-800 space-y-2 mt-auto">
                    
                    {/* Primary Optimize CTA */}
                    <button
                        onClick={handleOptimize}
                        disabled={isOptimizing || stops.length === 0}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                        <span>{isOptimizing ? "⚡ Computing Road Matrix & 2-Opt..." : "⚡ Optimize Route (Road Matrix + 2-Opt)"}</span>
                    </button>

                    {/* Step Visualizer Button */}
                    {hasOptimized && benchmarkData?.steps?.length > 1 && (
                        <button
                            onClick={() => setIsVisualizerOpen(true)}
                            className="w-full py-2 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/60 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <span>🔬</span>
                            <span>Open Step Visualizer ({benchmarkData.steps.length - 1} Swaps)</span>
                        </button>
                    )}

                    {/* Manifest Modal Button */}
                    {hasOptimized && (
                        <button
                            onClick={() => setIsManifestModalOpen(true)}
                            className="w-full py-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <span>📄</span>
                            <span>View & Export Delivery Manifest (CSV)</span>
                        </button>
                    )}

                    {/* Publish / Reset Actions */}
                    {hasOptimized && (
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={handlePublish}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    isPublished
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                                        : "bg-emerald-700 hover:bg-emerald-600 text-white"
                                }`}
                            >
                                <span>{isPublished ? "✅ Route Published to DB & Drivers" : "🚀 Publish Route to DB & Fleet"}</span>
                            </button>

                            <button
                                onClick={handleResetRoute}
                                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl text-xs font-semibold border border-gray-700 cursor-pointer"
                                title="Reset optimization"
                            >
                                ↺
                            </button>
                        </div>
                    )}
                </div>

            </aside>

            {/* ── MAP VIEW PANEL ───────────────────────────────────── */}
            <main className={`flex-1 flex flex-col relative ${
                mobileTab === "panel" ? "hidden md:flex" : "flex"
            }`}>

                {/* ── TOP FLOATING MAP HUD TOOLBAR ── */}
                {hasOptimized && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-gray-900/90 border border-gray-700/80 rounded-full px-3 py-1.5 shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs">
                        
                        {/* Route Summary Toggle Pill */}
                        <button
                            onClick={() => setShowSummaryWidget(!showSummaryWidget)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                showSummaryWidget
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-gray-800 text-gray-400 hover:text-gray-200"
                            }`}
                            title="Toggle Route Summary Widget"
                        >
                            <span>📋</span>
                            <span>Summary ({osrmDistance ? `${osrmDistance.toFixed(1)} km` : "Ready"})</span>
                        </button>

                        {/* Benchmark Toggle Pill */}
                        {benchmarkData && (
                            <button
                                onClick={() => setShowBenchmarkWidget(!showBenchmarkWidget)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                    showBenchmarkWidget
                                        ? "bg-emerald-600 text-white shadow-sm"
                                        : "bg-gray-800 text-gray-400 hover:text-gray-200"
                                }`}
                                title="Toggle Benchmark Audit Widget"
                            >
                                <span>📊</span>
                                <span>Benchmark ({benchmarkData.savingsPercent}% saved)</span>
                            </button>
                        )}

                        {/* Step Visualizer Toggle Pill */}
                        {benchmarkData?.steps?.length > 1 && (
                            <button
                                onClick={() => setIsVisualizerOpen(!isVisualizerOpen)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                    isVisualizerOpen
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "bg-gray-800 text-gray-400 hover:text-gray-200"
                                }`}
                                title="Toggle Step Visualizer"
                            >
                                <span>🔬</span>
                                <span>Visualizer</span>
                            </button>
                        )}

                        <div className="h-4 w-px bg-gray-700 mx-0.5"></div>

                        {/* Master Show/Hide Toggle */}
                        <button
                            onClick={() => setShowAllOverlays(!showAllOverlays)}
                            className="text-gray-400 hover:text-white text-[11px] font-semibold flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                            title={showAllOverlays ? "Hide All Floating Cards" : "Show All Floating Cards"}
                        >
                            <span>{showAllOverlays ? "👁️ Hide HUD" : "👁️ Show HUD"}</span>
                        </button>
                    </div>
                )}

                {/* Live Deviation Alert Banner */}
                {deviationState.isDeviated && (
                    <div className="absolute top-16 left-4 right-4 z-[1000] bg-rose-950/95 border border-rose-600 rounded-xl p-3.5 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-white animate-bounce">
                        <div className="flex items-center gap-2.5">
                            <span className="text-xl">⚠️</span>
                            <div>
                                <strong className="font-bold text-rose-300">Route Deviation Detected: </strong>
                                <span>Vehicle is ~{Math.round(deviationState.distanceMeters)}m off scheduled road polyline.</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleReoptimizeFromDriver}
                                className="flex-1 sm:flex-none px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors cursor-pointer shadow"
                            >
                                🔄 Dynamic Re-Route
                            </button>
                        </div>
                    </div>
                )}

                {/* ── DRAGGABLE ROUTE SUMMARY WIDGET ── */}
                {hasOptimized && showAllOverlays && (
                    <DraggableWidget
                        id="route-summary"
                        title="Route Summary"
                        icon="📋"
                        badge={osrmDistance ? `${osrmDistance.toFixed(1)} km` : "Ready"}
                        defaultPosition={{ x: window.innerWidth > 900 ? 410 : 20, y: 70 }}
                        isOpen={showSummaryWidget}
                        onClose={() => setShowSummaryWidget(false)}
                    >
                        <RouteSummary
                            stops={hasOptimized ? optimizedStops : stops}
                            depot={depot}
                            hasOptimized={hasOptimized}
                            osrmDistance={osrmDistance}
                        />
                    </DraggableWidget>
                )}

                {/* ── DRAGGABLE ALGORITHM BENCHMARK WIDGET ── */}
                {hasOptimized && benchmarkData && showAllOverlays && (
                    <DraggableWidget
                        id="algorithm-benchmark"
                        title="Algorithm Benchmark"
                        icon="⚡"
                        badge={`${benchmarkData.savingsPercent}% saved`}
                        defaultPosition={{ x: Math.max(20, window.innerWidth - 370), y: 70 }}
                        isOpen={showBenchmarkWidget}
                        onClose={() => setShowBenchmarkWidget(false)}
                    >
                        <AlgorithmBenchmark benchmarkData={benchmarkData} />
                    </DraggableWidget>
                )}

                {/* Bottom Overlay: Driver Live Status Pill */}
                {isPublished && (
                    <div className="absolute bottom-4 left-4 z-[999] bg-gray-900/90 border border-gray-700/80 rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <div>
                            <p className="font-bold text-white">
                                {driverTelemetry?.isLive ? "🟢 Driver Streaming Live GPS" : driverTelemetry?.isSimulating ? "⚡ Drive Simulation Running" : "🟡 Route Dispatched & Awaiting Driver"}
                            </p>
                            <p className="text-[11px] text-gray-400">
                                Completed: <strong className="text-emerald-400">{completedCount}</strong> / {totalCount} Stops ({totalCount > 0 ? Math.round((completedCount/totalCount)*100) : 0}%)
                            </p>
                        </div>

                        <button
                            onClick={() => navigate("/driver")}
                            className="ml-2 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                        >
                            Open Driver View →
                        </button>
                    </div>
                )}

                {/* Leaflet Map Component */}
                <MapView
                    stops={hasOptimized ? optimizedStops : stops}
                    depot={depot}
                    isDepotMode={isDepotMode}
                    selectedPosition={selectedPosition}
                    onMapClick={handleMapClick}
                    routePositions={activeRoutePositions}
                    driverPosition={driverTelemetry?.currentPosition || null}
                    driverHeading={driverTelemetry?.heading || 0}
                    completedStopIds={completedStopIds}
                />

            </main>

            {/* ── DRAGGABLE ALGORITHM STEP VISUALIZER MODAL ───────────────── */}
            <AlgorithmVisualizer
                isOpen={isVisualizerOpen}
                onClose={handleCloseVisualizer}
                steps={benchmarkData?.steps || []}
                depot={depot}
                onSelectStep={handleVisualizerStepSelect}
            />

            {/* ── DELIVERY MANIFEST MODAL ───────────────────────────────── */}
            <ManifestModal
                isOpen={isManifestModalOpen}
                onClose={() => setIsManifestModalOpen(false)}
                stops={hasOptimized ? optimizedStops : stops}
                depot={depot}
                distanceKm={osrmDistance || benchmarkData?.twoOptDistance || 0}
                benchmark={benchmarkData}
            />

        </div>
    );
}

export default Dispatcher;