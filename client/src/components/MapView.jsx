import { useEffect, useRef } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMapEvents,
    useMap,
    Polyline,
} from "react-leaflet";
import L from "leaflet";

// ─── Custom Depot Icon ──────────────────────────────────────────────────────
const depotIcon = L.divIcon({
    html: `
        <div style="
            background-color: #ef4444;
            width: 38px;
            height: 38px;
            border-radius: 8px;
            border: 3px solid #991b1b;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.4);
        ">🏭</div>
    `,
    className: "",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
});

// ─── Priority-Aware Stop Icon ──────────────────────────────────────────────
const createStopIcon = (index, priority = "standard") => {
    const isUrgent = priority === "urgent";
    const bg = isUrgent ? "#dc2626" : "#2563eb";
    const border = isUrgent ? "#991b1b" : "#1d4ed8";

    return L.divIcon({
        html: `
            <div style="
                background-color: ${bg};
                color: white;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: 2px solid ${border};
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                box-shadow: 0 2px 6px rgba(0,0,0,0.35);
                position: relative;
            ">
                ${index + 1}
                ${isUrgent ? '<span style="position:absolute;top:-4px;right:-4px;font-size:10px;">⚡</span>' : ''}
            </div>
        `,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
};

// ─── Live Driver Vehicle Icon ──────────────────────────────────────────────
const createDriverIcon = (heading = 0, isDeviated = false) => L.divIcon({
    html: `
        <div style="
            position: relative;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div style="
                position: absolute;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background-color: ${isDeviated ? "rgba(239, 68, 68, 0.35)" : "rgba(59, 130, 246, 0.35)"};
                animation: ${isDeviated ? "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite" : "none"};
            "></div>
            <div style="
                background-color: ${isDeviated ? "#dc2626" : "#2563eb"};
                color: white;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 2.5px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.35);
                transform: rotate(${heading}deg);
                transition: transform 0.3s ease;
            ">🚚</div>
        </div>
    `,
    className: "",
    iconSize: [44, 44],
    iconAnchor: [22, 22]
});

// ─── AutoBoundsFitter ───────────────────────────────────────────────────────
//
// Automatically fits the map camera viewport to contain all stops and the depot
// without hardcoding any city or coordinates!
// ───────────────────────────────────────────────────────────────────────────
function AutoBoundsFitter({ stops, depot }) {
    const map = useMap();
    const prevCountRef = useRef(0);

    useEffect(() => {
        const points = [];
        if (depot && Array.isArray(depot)) points.push(depot);
        if (stops && stops.length > 0) {
            stops.forEach((s) => {
                if (s.position && Array.isArray(s.position)) points.push(s.position);
            });
        }

        // Only auto-fit when points are added, loaded, or city preset changed
        if (points.length > 0 && points.length !== prevCountRef.current) {
            prevCountRef.current = points.length;
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 15,
                animate: true,
                duration: 1.2
            });
        }
    }, [stops, depot, map]);

    return null;
}

// ─── MapCenterer ────────────────────────────────────────────────────────────
function MapCenterer({ position }) {
    const map = useMap();

    useEffect(() => {
        if (position && Array.isArray(position) && position.length === 2) {
            map.flyTo(position, 14, {
                duration: 1.5
            });
        }
    }, [position, map]);

    return null;
}

// ─── MapClickHandler ────────────────────────────────────────────────────────
function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click: onMapClick
    });

    return null;
}

// ─── MapView Component ──────────────────────────────────────────────────────
function MapView({
    stops = [],
    depot = null,
    onMapClick = () => {},
    selectedPosition = null,
    routePositions = [],
    driverPosition = null,
    driverHeading = 0,
    isDeviated = false,
}) {
    // Dynamic initial center computed from depot, first stop, or global default
    const initialCenter = depot || (stops.length > 0 ? stops[0].position : [40.7580, -73.9855]);

    return (
        <MapContainer
            center={initialCenter}
            zoom={13}
            scrollWheelZoom={true}
            style={{
                height: "100%",
                width: "100%",
                background: "#0f172a"
            }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
            />

            {/* ── Auto-fit bounds around all markers ── */}
            <AutoBoundsFitter stops={stops} depot={depot} />

            {/* ── Depot marker ── */}
            {depot && (
                <Marker position={depot} icon={depotIcon}>
                    <Popup>
                        <div className="text-xs">
                            <strong className="text-sm text-red-600 block mb-1">🏭 Depot Hub</strong>
                            <span className="font-mono text-gray-600">
                                {depot[0].toFixed(5)}, {depot[1].toFixed(5)}
                            </span>
                        </div>
                    </Popup>
                </Marker>
            )}

            {/* ── Delivery stop markers ── */}
            {stops.map((stop, idx) => (
                <Marker
                    key={stop.id}
                    position={stop.position}
                    icon={createStopIcon(idx, stop.priority)}
                >
                    <Popup>
                        <div className="text-xs p-1">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="font-bold text-gray-900">{stop.name}</span>
                                {stop.priority === "urgent" && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700">
                                        ⚡ URGENT
                                    </span>
                                )}
                            </div>
                            <p className="font-mono text-gray-500 text-[11px]">
                                {stop.position[0].toFixed(5)}, {stop.position[1].toFixed(5)}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* ── "Pending" selected location marker ── */}
            {selectedPosition && (
                <Marker position={selectedPosition}>
                    <Popup>
                        <div className="text-xs font-semibold">📍 Selected Location</div>
                    </Popup>
                </Marker>
            )}

            {/* ── Driving Route Polyline ── */}
            {routePositions.length > 1 && (
                <Polyline
                    positions={routePositions}
                    pathOptions={{ 
                        color: "#2563eb",
                        weight: 5, 
                        opacity: 0.85,
                        lineCap: "round",
                        lineJoin: "round"
                    }}
                />
            )}

            {/* ── Live Moving Driver Vehicle Marker ── */}
            {driverPosition && Array.isArray(driverPosition) && driverPosition.length === 2 && (
                <Marker
                    position={driverPosition}
                    icon={createDriverIcon(driverHeading, isDeviated)}
                    zIndexOffset={1000}
                >
                    <Popup>
                        <div className="p-1 text-xs">
                            <strong className="text-sm block">🚚 Active Delivery Vehicle</strong>
                            <p className={`text-[11px] font-bold mt-1 ${isDeviated ? "text-red-600" : "text-emerald-600"}`}>
                                {isDeviated ? "⚠️ Off-Route / Detour Detected" : "🟢 On Scheduled Route"}
                            </p>
                            <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                                {driverPosition[0].toFixed(5)}, {driverPosition[1].toFixed(5)}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            )}

            {/* ── Map click handler ── */}
            <MapClickHandler onMapClick={onMapClick} />

            {/* ── Smooth center animation ── */}
            <MapCenterer position={selectedPosition} />

        </MapContainer>
    );
}

export default MapView;