
function StopList({ stops, onDelete,onEdit }){
    return(
        <>
       { stops.map((stop) => (
            <div key={stop.id}>
                <span>{stop.name}</span>
                < button
                    onClick={() => onEdit(stop)}
                >
                    Edit
                </button>

                <button
                    onClick={() => onDelete(stop.id)}
                >
                    Delete
                </button>

            </div>
            ))}

        </>
    )
}
export default StopList;