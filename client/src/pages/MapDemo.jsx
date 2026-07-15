import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useState } from "react";
import initialStops from "../data/stops";

function MapDemo() {
    const [name, setName] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [stops, setStops] = useState(initialStops);
    console.log(stops);

    function handleAddstop(){
         console.log("Button clicked");
    const newstop = {
        id: stops.length+1,
        name: name,
        position: [Number(latitude), Number(longitude)]
    };
    setStops([...stops, newstop]);
    console.log(newstop);

     if (!name || !latitude || !longitude) {
                alert("Please fill all fields");
                return;
            }

    }
   

    return (
        
        <>
        <input placeholder="Stop Name" value={name} onChange={(e)=>setName(e.target.value)} />
        <input placeholder="Latitude"  value={latitude} onChange={(e)=>setLatitude(e.target.value)} />
        <input placeholder="Longitude"  value={longitude} onChange={(e)=>setLongitude(e.target.value)} />
        

        <button onClick={handleAddstop}>
                Add Stop
            </button>

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
            {stops.map((stop) => (
                <Marker key={stop.id} position={stop.position}>
                    <Popup>
                        {stop.name}
                    </Popup>
                </Marker>
            ))}

        </MapContainer>
        </>

    )

}


export default MapDemo;
