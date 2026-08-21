// ─── Global City Presets for RouteIQ ───────────────────────────────────────
//
// Enables 1-click loading of realistic multi-stop logistics networks in major
// global metropolitan areas, removing all hardcoded assumptions.
// ───────────────────────────────────────────────────────────────────────────

export const CITY_PRESETS = [
    {
        id: "nyc",
        name: "🗽 New York",
        depot: [40.7580, -73.9855], // Times Square / Manhattan Hub
        stops: [
            { id: 101, name: "Central Park West", position: [40.7829, -73.9654], priority: "urgent" },
            { id: 102, name: "Empire State Plaza", position: [40.7484, -73.9857], priority: "standard" },
            { id: 103, name: "Grand Central Terminal", position: [40.7527, -73.9772], priority: "urgent" },
            { id: 104, name: "Chelsea Market", position: [40.7420, -74.0048], priority: "standard" },
            { id: 105, name: "Wall Street Financial Hub", position: [40.7075, -74.0090], priority: "flexible" }
        ]
    },
    {
        id: "sf",
        name: "🌉 San Francisco",
        depot: [37.7749, -122.4194], // Civic Center Hub
        stops: [
            { id: 201, name: "Fisherman's Wharf", position: [37.8080, -122.4177], priority: "standard" },
            { id: 202, name: "Financial District", position: [37.7946, -122.3999], priority: "urgent" },
            { id: 203, name: "Mission District Depot", position: [37.7599, -122.4148], priority: "standard" },
            { id: 204, name: "Golden Gate Park East", position: [37.7712, -122.4687], priority: "flexible" },
            { id: 205, name: "Presidio Heights Hub", position: [37.7885, -122.4542], priority: "standard" }
        ]
    },
    {
        id: "london",
        name: "🎡 London",
        depot: [51.5074, -0.1278], // Trafalgar Square Hub
        stops: [
            { id: 301, name: "Covent Garden Market", position: [51.5117, -0.1240], priority: "urgent" },
            { id: 302, name: "Tower of London Pier", position: [51.5081, -0.0759], priority: "standard" },
            { id: 303, name: "King's Cross Logistics", position: [51.5308, -0.1238], priority: "urgent" },
            { id: 304, name: "Hyde Park Corner", position: [51.5033, -0.1517], priority: "standard" },
            { id: 305, name: "Canary Wharf Gateway", position: [51.5055, -0.0196], priority: "flexible" }
        ]
    },
    {
        id: "delhi",
        name: "🏛️ New Delhi",
        depot: [28.6139, 77.2090], // Connaught Place Hub
        stops: [
            { id: 401, name: "Karol Bagh Commercial", position: [28.6517, 77.1906], priority: "urgent" },
            { id: 402, name: "Lajpat Nagar Central", position: [28.5677, 77.2433], priority: "standard" },
            { id: 403, name: "Nehru Place Tech Hub", position: [28.5494, 77.2527], priority: "urgent" },
            { id: 404, name: "Cyber City Crossing", position: [28.4950, 77.0890], priority: "flexible" },
            { id: 405, name: "Chandni Chowk Depot", position: [28.6560, 77.2300], priority: "standard" }
        ]
    },
    {
        id: "bengaluru",
        name: "💻 Bengaluru",
        depot: [12.9716, 77.5946], // MG Road Hub
        stops: [
            { id: 501, name: "Indiranagar 100ft", position: [12.9784, 77.6408], priority: "urgent" },
            { id: 502, name: "Koramangala 4th Block", position: [12.9352, 77.6245], priority: "standard" },
            { id: 503, name: "Whitefield ITPL Hub", position: [12.9863, 77.7346], priority: "flexible" },
            { id: 504, name: "Electronic City Gate 1", position: [12.8399, 77.6770], priority: "standard" },
            { id: 505, name: "HSR Layout Sector 2", position: [12.9121, 77.6446], priority: "urgent" }
        ]
    },
    {
        id: "tokyo",
        name: "🗼 Tokyo",
        depot: [35.6762, 139.6503], // Shinjuku Central Hub
        stops: [
            { id: 601, name: "Shibuya Crossing Hub", position: [35.6595, 139.7004], priority: "urgent" },
            { id: 602, name: "Ginza Luxury Avenue", position: [35.6719, 139.7648], priority: "standard" },
            { id: 603, name: "Akihabara Electronic Town", position: [35.6983, 139.7731], priority: "urgent" },
            { id: 604, name: "Roppongi Hills Center", position: [35.6605, 139.7292], priority: "standard" },
            { id: 605, name: "Tokyo Station Marunouchi", position: [35.6812, 139.7671], priority: "flexible" }
        ]
    }
];

export default CITY_PRESETS;
