import { describe, it, expect } from "vitest";
import {
    optimizeRouteWithBenchmark,
    nearestNeighbor
} from "../src/utils/optimizeRoute";

describe("TSP Optimization Engine (Nearest-Neighbor & 2-Opt)", () => {
    const depot = [40.7580, -73.9855];

    it("should handle 0 stops gracefully", () => {
        const result = optimizeRouteWithBenchmark([], depot);
        expect(result.finalRoute).toEqual([]);
        expect(result.naiveDistance).toBe(0);
        expect(result.twoOptDistance).toBe(0);
        expect(result.savingsPercent).toBe(0);
    });

    it("should handle 1 stop without error", () => {
        const singleStop = [{ id: 101, name: "Solo Stop", position: [40.7829, -73.9654], priority: "standard" }];
        const result = optimizeRouteWithBenchmark(singleStop, depot);
        expect(result.finalRoute.length).toBe(1);
        expect(result.finalRoute[0].id).toBe(101);
        expect(result.twoOptDistance).toBeGreaterThan(0);
    });

    it("should handle 2 stops correctly without crashing", () => {
        const twoStops = [
            { id: 101, name: "Stop A", position: [40.7829, -73.9654], priority: "standard" },
            { id: 102, name: "Stop B", position: [40.7484, -73.9857], priority: "standard" }
        ];
        const result = optimizeRouteWithBenchmark(twoStops, depot);
        expect(result.finalRoute.length).toBe(2);
        expect(result.twoOptDistance).toBeGreaterThan(0);
    });

    it("should handle duplicate stop coordinates without infinite loop", () => {
        const duplicateStops = [
            { id: 1, name: "Stop 1", position: [40.7580, -73.9855], priority: "standard" },
            { id: 2, name: "Stop 2", position: [40.7580, -73.9855], priority: "standard" },
            { id: 3, name: "Stop 3", position: [40.7829, -73.9654], priority: "standard" }
        ];
        const result = optimizeRouteWithBenchmark(duplicateStops, depot);
        expect(result.finalRoute.length).toBe(3);
    });

    it("should preserve 2-Opt monotonicity: 2-Opt distance must be <= Nearest-Neighbor distance", () => {
        const multiStops = [
            { id: 1, name: "Stop 1", position: [40.7829, -73.9654], priority: "standard" },
            { id: 2, name: "Stop 2", position: [40.7128, -74.0060], priority: "standard" },
            { id: 3, name: "Stop 3", position: [40.7527, -73.9772], priority: "standard" },
            { id: 4, name: "Stop 4", position: [40.7420, -74.0048], priority: "standard" },
            { id: 5, name: "Stop 5", position: [40.7484, -73.9857], priority: "standard" },
            { id: 6, name: "Stop 6", position: [40.7614, -73.9776], priority: "standard" }
        ];

        const result = optimizeRouteWithBenchmark(multiStops, depot);
        expect(result.twoOptDistance).toBeLessThanOrEqual(result.nnDistance + 0.001);
    });

    it("should preserve all input stops (no missing or duplicated stops in final tour)", () => {
        const testStops = Array.from({ length: 10 }, (_, i) => ({
            id: i + 100,
            name: `Test Stop ${i}`,
            position: [40.7580 + (i * 0.01), -73.9855 + (i * 0.01)],
            priority: "standard"
        }));

        const result = optimizeRouteWithBenchmark(testStops, depot);
        const finalIds = result.finalRoute.map(s => s.id).sort((a, b) => a - b);
        const inputIds = testStops.map(s => s.id).sort((a, b) => a - b);

        expect(finalIds).toEqual(inputIds);
    });

    it("should sequence urgent priority stops first", () => {
        const stops = [
            { id: 1, name: "Standard Close", position: [40.7590, -73.9860], priority: "standard" },
            { id: 2, name: "Urgent Far", position: [40.8000, -73.9500], priority: "urgent" },
            { id: 3, name: "Standard Medium", position: [40.7700, -73.9700], priority: "standard" }
        ];

        const nnRoute = nearestNeighbor(stops, depot);
        expect(nnRoute[0].id).toBe(2); // Urgent stop must be visited first
    });

    it("should optimize correctly when given an explicit distance matrix", () => {
        const stops = [
            { id: 1, name: "Stop 1", position: [40.78, -73.96], priority: "standard" },
            { id: 2, name: "Stop 2", position: [40.74, -73.98], priority: "standard" }
        ];

        const mockMatrix = {
            distances: [
                [0, 5.0, 3.0],
                [5.0, 0, 4.0],
                [3.0, 4.0, 0]
            ],
            source: "mock_matrix"
        };

        const result = optimizeRouteWithBenchmark(stops, depot, mockMatrix);
        expect(result.finalRoute.length).toBe(2);
        expect(result.twoOptDistance).toBeGreaterThan(0);
    });
});
