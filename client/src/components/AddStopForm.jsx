

function AddStopForm({ name, latitude, longitude, setName, setLatitude, setLongitude, onAddStop ,editingId }){
    return (<>
        <input placeholder="Stop Name" value={name} onChange={(e)=>setName(e.target.value)} />
        <input placeholder="Latitude"  value={latitude} onChange={(e)=>setLatitude(e.target.value)} />
        <input placeholder="Longitude"  value={longitude} onChange={(e)=>setLongitude(e.target.value)} />
        

        

        <button onClick={onAddStop}>
            {editingId === null ? "Add Stop" : "Update Stop"}
        </button>

          </>);
}

export default AddStopForm;