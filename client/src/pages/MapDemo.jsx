import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

function MapDemo() {

    return (

        <MapContainer
            center={[31.4685, 76.2708]}
            zoom={15}
            scrollWheelZoom={false}
            style={{ height: "100vh", width: "100%" }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
            />
            <Marker position={[31.4685, 76.2708]}>
                <Popup>
                    🚚 RouteIQ Depot
                </Popup>
            </Marker>

        </MapContainer>

    )

}

export default MapDemo;