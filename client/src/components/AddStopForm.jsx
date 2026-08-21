import { useState, useEffect } from "react";
import { searchAddress } from "../services/geocoder";

// ─── AddStopForm ────────────────────────────────────────────────────────────
//
// Controlled inputs with high-contrast text styling, 500ms debounced address
// autocomplete search, and delivery priority selection.
// ───────────────────────────────────────────────────────────────────────────

function AddStopForm({
    name,
    latitude,
    longitude,
    priority = "standard",
    setName,
    setLatitude,
    setLongitude,
    setPriority = () => {},
    onAddStop,
    onCancelEdit,
    editingId,
    onLocationSelect,
}) {
    const isEditMode = editingId !== null;

    // ── Address Search State ───────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // ── Handle Search Input Change ─────────────────────────────────────────
    function handleSearchChange(e) {
        const val = e.target.value;
        setSearchQuery(val);
        if (val.trim().length >= 3) {
            setIsSearching(true);
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }
    }

    // ── Debounced Search Effect (500ms) ────────────────────────────────────
    useEffect(() => {
        if (searchQuery.trim().length < 3) {
            return;
        }

        const timerId = setTimeout(async () => {
            try {
                const results = await searchAddress(searchQuery);
                setSearchResults(results);
            } catch (err) {
                console.error("Geocoding failed:", err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(timerId);
    }, [searchQuery]);

    // ── handleSelectAddress ────────────────────────────────────────────────
    function handleSelectAddress(result) {
        setName(result.shortName);
        setLatitude(result.lat.toString());
        setLongitude(result.lng.toString());
        
        setSearchQuery("");
        setSearchResults([]);
        setIsSearching(false);

        if (onLocationSelect) {
            onLocationSelect([result.lat, result.lng]);
        }
    }

    // ── Validate inputs before submitting ───────────────────────────────────
    function handleSubmit() {
        if (!name.trim()) {
            alert("Stop name cannot be empty.");
            return;
        }

        const lat = Number(latitude);
        if (isNaN(lat) || latitude === "") {
            alert("Latitude must be a valid number.");
            return;
        }

        const lng = Number(longitude);
        if (isNaN(lng) || longitude === "") {
            alert("Longitude must be a valid number.");
            return;
        }

        if (lat < -90 || lat > 90) {
            alert("Latitude must be between -90 and 90.");
            return;
        }

        if (lng < -180 || lng > 180) {
            alert("Longitude must be between -180 and 180.");
            return;
        }

        onAddStop();
    }

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-visible shadow-lg">

            {/* Header */}
            <div className="px-4 py-2.5 bg-gray-950/80 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span>{isEditMode ? "✏️" : "➕"}</span>
                    <span>{isEditMode ? "Edit Delivery Stop" : "Add Delivery Stop"}</span>
                </h3>
                {isEditMode && (
                    <button
                        onClick={onCancelEdit}
                        className="text-gray-400 hover:text-white text-xs underline cursor-pointer"
                    >
                        Cancel
                    </button>
                )}
            </div>

            <div className="p-3.5 space-y-3.5">

                {/* ── ADDRESS AUTOCOMPLETE SEARCH BAR ── */}
                <div className="relative z-50">
                    <label className="block text-xs font-semibold text-blue-400 mb-1">
                        🔍 Search Global Address
                    </label>
                    <input
                        type="text"
                        placeholder="Type address (e.g. Central Park, NY)..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full px-3 py-2 text-xs font-medium text-white placeholder-gray-500 bg-gray-950 border border-blue-500/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 shadow-inner"
                    />

                    {/* Autocomplete Dropdown */}
                    {isSearching && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-2 text-xs text-blue-400 font-mono z-50 animate-pulse">
                            Searching OpenStreetMap Nominatim...
                        </div>
                    )}

                    {!isSearching && searchResults.length > 0 && (
                        <ul className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-h-48 overflow-y-auto z-50 divide-y divide-gray-800">
                            {searchResults.map((result) => (
                                <li
                                    key={result.id}
                                    onClick={() => handleSelectAddress(result)}
                                    className="px-3 py-2 hover:bg-blue-900/40 cursor-pointer transition-colors"
                                >
                                    <p className="text-xs font-bold text-white truncate">
                                        {result.shortName}
                                    </p>
                                    <p className="text-[11px] text-gray-400 truncate mt-0.5">
                                        {result.displayName}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="border-t border-gray-800" />

                {/* Stop name input */}
                <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                        Stop Name / Customer
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Customer A / Tech Hub"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-medium text-white placeholder-gray-500 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                    />
                </div>

                {/* Coordinates row */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-[11px] font-medium text-gray-400 mb-1">
                            Latitude
                        </label>
                        <input
                            type="number"
                            placeholder="e.g. 40.7580"
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value)}
                            step="any"
                            className="w-full px-2.5 py-1.5 text-xs font-mono text-white placeholder-gray-600 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-medium text-gray-400 mb-1">
                            Longitude
                        </label>
                        <input
                            type="number"
                            placeholder="e.g. -73.9855"
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value)}
                            step="any"
                            className="w-full px-2.5 py-1.5 text-xs font-mono text-white placeholder-gray-600 bg-gray-950 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Stop Priority */}
                <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                        Delivery Priority
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                        <button
                            type="button"
                            onClick={() => setPriority("standard")}
                            className={`py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-all ${
                                priority === "standard"
                                    ? "bg-blue-600/30 border-blue-500 text-blue-300 font-bold"
                                    : "bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800"
                            }`}
                        >
                            Standard
                        </button>
                        <button
                            type="button"
                            onClick={() => setPriority("urgent")}
                            className={`py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-all ${
                                priority === "urgent"
                                    ? "bg-red-600/30 border-red-500 text-red-300 font-bold shadow-sm shadow-red-500/20"
                                    : "bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800"
                            }`}
                        >
                            ⚡ Urgent
                        </button>
                        <button
                            type="button"
                            onClick={() => setPriority("flexible")}
                            className={`py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-all ${
                                priority === "flexible"
                                    ? "bg-purple-600/30 border-purple-500 text-purple-300 font-bold"
                                    : "bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800"
                            }`}
                        >
                            Flexible
                        </button>
                    </div>
                </div>

                {/* Hint */}
                <p className="text-[11px] text-gray-500">
                    💡 Click on map to place pin, or search address above.
                </p>

                {/* Submit button */}
                <button
                    onClick={handleSubmit}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                >
                    {isEditMode ? "Update Stop" : "Add Stop to Queue"}
                </button>

            </div>
        </div>
    );
}

export default AddStopForm;