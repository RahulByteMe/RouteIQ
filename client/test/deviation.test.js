import { describe, it, expect } from "vitest";
import { checkRouteDeviation } from "../src/utils/deviation";

describe("Cross-Track Deviation Detection Engine", () => {
    // A straight route segment from NYC 40.7500,-73.9800 to 40.7600,-73.9800
    const route = [
        [40.7500, -73.9800],
        [40.7600, -73.9800],
        [40.7700, -73.9800]
    ];

    it("should report 0m deviation and isDeviated=false for vehicle exactly on segment", () => {
        const vehiclePos = [40.7550, -73.9800]; // midpoint of segment 1
        const result = checkRouteDeviation(vehiclePos, route, 500);

        expect(result.isDeviated).toBe(false);
        expect(result.distanceMeters).toBeLessThan(10);
    });

    it("should report isDeviated=false for vehicle within the 500m threshold", () => {
        // ~200 meters east
        const vehiclePos = [40.7550, -73.9780];
        const result = checkRouteDeviation(vehiclePos, route, 500);

        expect(result.isDeviated).toBe(false);
        expect(result.distanceMeters).toBeLessThan(500);
    });

    it("should report isDeviated=true for vehicle 1km away from route", () => {
        // ~1.5 km west
        const vehiclePos = [40.7550, -73.9600];
        const result = checkRouteDeviation(vehiclePos, route, 500);

        expect(result.isDeviated).toBe(true);
        expect(result.distanceMeters).toBeGreaterThan(500);
    });

    it("should handle empty or single-point route gracefully", () => {
        expect(checkRouteDeviation([40.75, -73.98], [], 500)).toEqual({
            isDeviated: false,
            distanceMeters: 0,
            minDistanceKm: 0
        });
        expect(checkRouteDeviation([40.75, -73.98], [[40.75, -73.98]], 500)).toEqual({
            isDeviated: false,
            distanceMeters: 0,
            minDistanceKm: 0
        });
    });
});
