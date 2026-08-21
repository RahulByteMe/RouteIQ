// ─── Indian Metropolitan City Presets for RouteIQ ───────────────────────────
//
// Curated logistics hubs across major Indian commercial & tech capitals:
// 1. Delhi NCR (National Capital Region)
// 2. Bengaluru (Silicon Valley of India)
// 3. Mumbai (Financial Capital)
// 4. Hyderabad (Cyberabad Tech Corridor)
// 5. Pune (Automotive & IT Hub)
// 6. Chennai (Manufacturing & SaaS Capital)
// 7. Kolkata (Eastern Logistics Hub)
// ───────────────────────────────────────────────────────────────────────────

export const CITY_PRESETS = [
    {
        id: "delhi",
        name: "🏛️ Delhi NCR",
        state: "Delhi & NCR",
        depot: [28.6139, 77.2090], // Connaught Place Central Logistics Hub
        stops: [
            { id: 401, name: "Karol Bagh Commercial Market", position: [28.6517, 77.1906], priority: "urgent" },
            { id: 402, name: "Lajpat Nagar Central Market", position: [28.5677, 77.2433], priority: "standard" },
            { id: 403, name: "Nehru Place IT & Electronics Hub", position: [28.5494, 77.2527], priority: "urgent" },
            { id: 404, name: "Cyber City DLF Phase 2 (Gurugram)", position: [28.4950, 77.0890], priority: "flexible" },
            { id: 405, name: "Noida Sector 18 Commercial Hub", position: [28.5708, 77.3260], priority: "standard" },
            { id: 406, name: "Chandni Chowk Wholesale Hub", position: [28.6560, 77.2300], priority: "urgent" },
            { id: 407, name: "Okhla Industrial Area Phase 3", position: [28.5355, 77.2710], priority: "standard" }
        ]
    },
    {
        id: "bengaluru",
        name: "💻 Bengaluru",
        state: "Karnataka",
        depot: [12.9716, 77.5946], // MG Road Central Dispatch Hub
        stops: [
            { id: 501, name: "Indiranagar 100ft Road Delivery Point", position: [12.9784, 77.6408], priority: "urgent" },
            { id: 502, name: "Koramangala 4th Block Retail Hub", position: [12.9352, 77.6245], priority: "standard" },
            { id: 503, name: "Whitefield ITPL Technology Park", position: [12.9863, 77.7346], priority: "flexible" },
            { id: 504, name: "Electronic City Phase 1 Gate", position: [12.8399, 77.6770], priority: "standard" },
            { id: 505, name: "HSR Layout Sector 2 Startups Hub", position: [12.9121, 77.6446], priority: "urgent" },
            { id: 506, name: "Jayanagar 4th Block Shopping Complex", position: [12.9299, 77.5826], priority: "standard" }
        ]
    },
    {
        id: "mumbai",
        name: "🌊 Mumbai",
        state: "Maharashtra",
        depot: [19.0657, 72.8687], // BKC (Bandra Kurla Complex) Central Logistics
        stops: [
            { id: 101, name: "Nariman Point Business District", position: [18.9256, 72.8242], priority: "urgent" },
            { id: 102, name: "Lower Parel High Street Phoenix", position: [18.9953, 72.8290], priority: "urgent" },
            { id: 103, name: "Andheri East MIDC Industrial Estate", position: [19.1197, 72.8764], priority: "standard" },
            { id: 104, name: "Powai Hiranandani Tech Park", position: [19.1176, 72.9060], priority: "flexible" },
            { id: 105, name: "Dadar TT Circle Hub", position: [19.0178, 72.8478], priority: "standard" },
            { id: 106, name: "Bandra Linking Road Retail Corridor", position: [19.0596, 72.8335], priority: "standard" }
        ]
    },
    {
        id: "hyderabad",
        name: "💎 Hyderabad",
        state: "Telangana",
        depot: [17.4483, 78.3915], // HITEC City Cyber Towers Hub
        stops: [
            { id: 201, name: "Gachibowli Financial District", position: [17.4168, 78.3428], priority: "urgent" },
            { id: 202, name: "Banjara Hills Road No. 12", position: [17.4156, 78.4350], priority: "standard" },
            { id: 203, name: "Jubilee Hills Checkpost Hub", position: [17.4319, 78.4073], priority: "urgent" },
            { id: 204, name: "Madhapur Avasa Crossing", position: [17.4486, 78.3842], priority: "standard" },
            { id: 205, name: "Secunderabad Clock Tower", position: [17.4411, 78.4983], priority: "flexible" }
        ]
    },
    {
        id: "pune",
        name: "🏰 Pune",
        state: "Maharashtra",
        depot: [18.5204, 73.8567], // Shivajinagar Central Dispatch
        stops: [
            { id: 301, name: "Hinjewadi IT Park Phase 1", position: [18.5913, 73.7389], priority: "urgent" },
            { id: 302, name: "Viman Nagar Commercial Center", position: [18.5679, 73.9143], priority: "standard" },
            { id: 303, name: "Koregaon Park North Main Road", position: [18.5362, 73.8940], priority: "urgent" },
            { id: 304, name: "Kothrud Paud Road Corridor", position: [18.5074, 73.8077], priority: "standard" },
            { id: 305, name: "Magarpatta City Hadapsar", position: [18.5158, 73.9272], priority: "flexible" }
        ]
    },
    {
        id: "chennai",
        name: "🏖️ Chennai",
        state: "Tamil Nadu",
        depot: [13.0418, 80.2341], // T. Nagar Panagal Park Hub
        stops: [
            { id: 701, name: "OMR IT Corridor Thoraipakkam", position: [12.9430, 80.2370], priority: "urgent" },
            { id: 702, name: "Guindy Industrial Estate", position: [13.0067, 80.2026], priority: "standard" },
            { id: 703, name: "Anna Nagar 2nd Avenue", position: [13.0850, 80.2101], priority: "urgent" },
            { id: 704, name: "Adyar Gandhi Nagar", position: [13.0064, 80.2575], priority: "standard" },
            { id: 705, name: "Mylapore Luz Corner", position: [13.0339, 80.2678], priority: "flexible" }
        ]
    },
    {
        id: "kolkata",
        name: "🚋 Kolkata",
        state: "West Bengal",
        depot: [22.5535, 88.3518], // Park Street Central Hub
        stops: [
            { id: 801, name: "Salt Lake Sector V Tech City", position: [22.5735, 88.4331], priority: "urgent" },
            { id: 802, name: "New Town Action Area 1", position: [22.5850, 88.4735], priority: "standard" },
            { id: 803, name: "Howrah Station Logistics Yard", position: [22.5855, 88.3433], priority: "urgent" },
            { id: 804, name: "Ballygunge Phari Crossing", position: [22.5280, 88.3655], priority: "standard" },
            { id: 805, name: "Burrabazar Wholesale Hub", position: [22.5830, 88.3550], priority: "flexible" }
        ]
    }
];

export default CITY_PRESETS;
