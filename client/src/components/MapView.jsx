import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMapEvents,
    Polyline,
    
} from "react-leaflet";

function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click: onMapClick
    });

    return null;
}

function MapView({
    stops,
    onMapClick,
    selectedPosition,
    routePositions = [],
    Depot
}) {
    return (
        <MapContainer
            center={[31.4685, 76.2708]}
            zoom={15}
            scrollWheelZoom={false}
            style={{
                height: "100vh",
                width: "100%"
            }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
            />

            {/* Stops */}
            {stops.map((stop) => (
                <Marker
                    key={stop.id}
                    position={stop.position}
                >
                    <Popup>
                        {stop.name}
                    </Popup>
                </Marker>
            ))}

            {/* Selected location */}
            {selectedPosition && (
                <Marker position={selectedPosition}>
                    <Popup>
                        Selected Location
                    </Popup>
                </Marker>
            )}

            // depot marker
            {Depot && (
                <Marker position={Depot}>
                    <Popup>
                        Depot
                    </Popup>
                </Marker>
            )}

            {/* Map click */}
            <MapClickHandler
                onMapClick={onMapClick}
            />

            {/* Optimized route */}
            {routePositions.length > 1 && (
                <Polyline
                    positions={routePositions}
                />
            )}
        </MapContainer>
    );
}

export default MapView;