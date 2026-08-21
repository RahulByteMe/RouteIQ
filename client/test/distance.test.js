import { describe, it, expect } from "vitest";
import calculateDistance from "../src/utils/distance";
import calculateRouteDistance from "../src/utils/routeDistance";

describe("Geodesic Distance Calculations (Haversine Formula)", () => {
    it("should return 0 for identical coordinates", () => {
        const coord = [40.7128, -74.0060];
        expect(calculateDistance(coord, coord)).toBe(0);
    });

    it("should return 0 for missing or null inputs", () => {
        expect(calculateDistance(null, [40.7128, -74.0060])).toBe(0);
        expect(calculateDistance([40.7128, -74.0060], undefined)).toBe(0);
    });

    it("should accurately compute distance between known city pairs (London -> Paris ~343km)", () => {
        const london = [51.5074, -0.1278];
        const paris = [48.8566, 2.3522];
        const dist = calculateDistance(london, paris);
        expect(dist).toBeGreaterThan(340);
        expect(dist).toBeLessThan(348);
    });

    it("should accurately compute distance across continents (NYC -> Tokyo ~10,850km)", () => {
        const nyc = [40.7128, -74.0060];
        const tokyo = [35.6762, 139.6503];
        const dist = calculateDistance(nyc, tokyo);
        expect(dist).toBeGreaterThan(10800);
        expect(dist).toBeLessThan(10950);
    });

    it("should handle southern hemisphere coordinates correctly (Sydney -> Melbourne ~713km)", () => {
        const sydney = [-33.8688, 151.2093];
        const melbourne = [-37.8136, 144.9631];
        const dist = calculateDistance(sydney, melbourne);
        expect(dist).toBeGreaterThan(700);
        expect(dist).toBeLessThan(725);
    });

    it("should calculate total round-trip route distance returning to depot", () => {
        const depot = [40.7580, -73.9855];
        const stops = [
            { id: 1, position: [40.7829, -73.9654] },
            { id: 2, position: [40.7484, -73.9857] }
        ];
        const total = calculateRouteDistance(depot, stops);
        expect(total).toBeGreaterThan(0);
    });

    it("should return 0 route distance for empty stops", () => {
        expect(calculateRouteDistance([40.7580, -73.9855], [])).toBe(0);
        expect(calculateRouteDistance(null, null)).toBe(0);
    });
});
