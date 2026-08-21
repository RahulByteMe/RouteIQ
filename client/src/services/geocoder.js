// ─── Geocoder Service ──────────────────────────────────────────────────────
//
// WHAT IT DOES:
//   Communicates with the free Nominatim API provided by OpenStreetMap.
//   It converts human-readable addresses (e.g., "Central Park, NY") into
//   geographic coordinates (Latitude and Longitude).
//
// API DOCUMENTATION:
//   https://nominatim.org/release-docs/develop/api/Search/
//
// USAGE LIMITS:
//   Nominatim is a free, shared API. They strictly require NO MORE than
//   1 request per second. Our frontend must "debounce" user typing to
//   avoid getting temporarily blocked!
// ───────────────────────────────────────────────────────────────────────────

export async function searchAddress(query) {
    if (!query || query.trim().length < 3) {
        return [];
    }

    try {
        // format=json: Returns data in JSON format instead of XML
        // q=...: The search query (URL encoded to handle spaces/special chars)
        // limit=5: Return a maximum of 5 suggestions
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;

        const response = await fetch(url, {
            headers: {
                "Accept-Language": "en"
            }
        });
        
        if (!response.ok) {
            throw new Error(`Geocoding error: ${response.status}`);
        }

        const data = await response.json();

        // Map the raw API response into a cleaner format for our app
        return data.map(item => ({
            id: item.place_id,
            displayName: item.display_name, // Full address: "Central Park, New York, NY..."
            shortName: item.name || item.display_name.split(",")[0], // Just "Central Park"
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
        }));

    } catch (error) {
        console.error("Error searching address:", error);
        return [];
    }
}
