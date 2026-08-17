import MapView from "../components/MapView";
import { useEffect, useState } from "react";
import initialStops from "../data/stops";
import StopList from "../components/StopList";
import AddStopForm from "../components/AddStopForm";
import optimizeRoute from "../utils/optimizeRoute";

function MapDemo() {
    const [name, setName] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");

    const [stops, setStops] = useState(() => {
        const savedStops = localStorage.getItem("stops");

        if (savedStops) {
            return JSON.parse(savedStops);
        }

        return initialStops;
    });

    const [editingId, setEditingId] = useState(null);
    const [selectedPosition, setSelectedPosition] = useState(null);

    // Depot
    const [depot, setDepot] = useState(null);

    // Save stops
    useEffect(() => {
        localStorage.setItem("stops", JSON.stringify(stops));
    }, [stops]);

    // Map click
    function handleMapClick(e) {
        const { lat, lng } = e.latlng;

        setLatitude(lat);
        setLongitude(lng);
        setSelectedPosition([lat, lng]);
    }

    // Add / Update Stop
    function handleAddstop() {
        if (!name || !latitude || !longitude) {
            alert("Please fill all fields");
            return;
        }

        if (editingId === null) {
            const newStop = {
                id: stops.length + 1,
                name: name,
                position: [
                    Number(latitude),
                    Number(longitude)
                ]
            };

            setStops([...stops, newStop]);
        } else {
            setStops(
                stops.map((stop) => {
                    if (stop.id === editingId) {
                        return {
                            id: stop.id,
                            name: name,
                            position: [
                                Number(latitude),
                                Number(longitude)
                            ]
                        };
                    }

                    return stop;
                })
            );

            setEditingId(null);
        }

        setName("");
        setLatitude("");
        setLongitude("");
        setSelectedPosition(null);
    }

    // Delete Stop
    function handleDeleteStop(id) {
        setStops(
            stops.filter((stop) => {
                return stop.id !== id;
            })
        );
    }

    // Edit Stop
    function handleEditStop(stop) {
        setEditingId(stop.id);
        setName(stop.name);
        setLatitude(stop.position[0]);
        setLongitude(stop.position[1]);
    }

    // Optimize route only when depot exists
    const optimizedStops = depot
        ? optimizeRoute(stops, depot)
        : [];

    // Convert optimized stops into coordinates
    const routePositions = optimizedStops.map(
        (stop) => stop.position
    );

    return (
        <>
            <AddStopForm
                name={name}
                latitude={latitude}
                longitude={longitude}
                setName={setName}
                setLatitude={setLatitude}
                setLongitude={setLongitude}
                onAddStop={handleAddstop}
                editingId={editingId}
            />

            <button
                onClick={() => {
                    if (!selectedPosition) {
                        alert("Click on the map to select depot");
                        return;
                    }

                    setDepot(selectedPosition);
                }}
            >
                Set Depot
            </button>

            {depot && (
                <p>
                    Depot: {depot[0]}, {depot[1]}
                </p>
            )}

            <MapView
                stops={stops}
                onMapClick={handleMapClick}
                selectedPosition={selectedPosition}
                routePositions={routePositions}
            />

            <StopList
                stops={stops}
                onDelete={handleDeleteStop}
                onEdit={handleEditStop}
            />
        </>
    );
}

export default MapDemo;