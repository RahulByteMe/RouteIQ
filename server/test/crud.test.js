import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import http from "http";
import { createApp } from "../src/app.js";

const app = createApp();
const server = http.createServer(app);

describe("Logistics CRUD & Route Management API Tests", () => {
    let port;
    let baseUrl;
    let dispatcherToken;

    test("setup test server", async () => {
        await new Promise((resolve) => {
            server.listen(0, async () => {
                port = server.address().port;
                baseUrl = `http://127.0.0.1:${port}/api`;

                // Log in as pre-seeded dispatcher
                const loginRes = await fetch(`${baseUrl}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: "dispatcher@routeiq.com",
                        password: "password123"
                    })
                });
                const loginData = await loginRes.json();
                dispatcherToken = loginData.token;
                resolve();
            });
        });
    });

    test("GET /api/stops should return array of delivery stops", async () => {
        const res = await fetch(`${baseUrl}/stops`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.ok(Array.isArray(data));
        assert.ok(data.length > 0);
    });

    test("POST /api/depot should update depot coordinates", async () => {
        const newDepot = [40.7580, -73.9855];
        const res = await fetch(`${baseUrl}/depot`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${dispatcherToken}`
            },
            body: JSON.stringify({ depot: newDepot })
        });

        assert.equal(res.status, 200);
        const data = await res.json();
        assert.deepEqual(data.depot, newDepot);
    });

    test("POST /api/routes/publish should publish an optimized delivery tour", async () => {
        const routePayload = {
            depot: [40.7580, -73.9855],
            stops: [
                { id: 101, name: "Stop 1", position: [40.7829, -73.9654], priority: "urgent" },
                { id: 102, name: "Stop 2", position: [40.7484, -73.9857], priority: "standard" }
            ],
            osrmRoute: [
                [40.7580, -73.9855],
                [40.7829, -73.9654],
                [40.7484, -73.9857],
                [40.7580, -73.9855]
            ],
            osrmDistance: 12.45,
            benchmark: {
                savingsPercent: 32.5,
                naiveDistance: 18.45,
                twoOptDistance: 12.45
            }
        };

        const res = await fetch(`${baseUrl}/routes/publish`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${dispatcherToken}`
            },
            body: JSON.stringify(routePayload)
        });

        assert.equal(res.status, 201);
        const data = await res.json();
        assert.equal(data.stops.length, 2);
        assert.equal(data.osrmDistance, 12.45);
    });

    test("GET /api/routes/published should return the active published route", async () => {
        const res = await fetch(`${baseUrl}/routes/published`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.ok(data.depot);
        assert.ok(data.stops);
        assert.equal(data.stops.length, 2);
    });

    test("DELETE /api/stops/:id should remove a stop", async () => {
        // First create a stop
        const createRes = await fetch(`${baseUrl}/stops`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${dispatcherToken}`
            },
            body: JSON.stringify({
                name: "Stop To Delete",
                position: [40.7128, -74.0060]
            })
        });
        const created = await createRes.json();

        // Delete it
        const deleteRes = await fetch(`${baseUrl}/stops/${created.id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${dispatcherToken}`
            }
        });
        assert.equal(deleteRes.status, 200);
    });

    after(async () => {
        if (server.closeAllConnections) {
            server.closeAllConnections();
        }
        await new Promise((resolve) => server.close(resolve));
    });
});
