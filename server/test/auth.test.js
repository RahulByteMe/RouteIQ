import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import http from "http";
import { createApp } from "../src/app.js";

const app = createApp();
const server = http.createServer(app);

describe("Authentication & RBAC Middleware API Tests", () => {
    let port;
    let baseUrl;
    let dispatcherToken;
    let driverToken;

    test("setup test server", async () => {
        await new Promise((resolve) => {
            server.listen(0, () => {
                port = server.address().port;
                baseUrl = `http://127.0.0.1:${port}/api`;
                resolve();
            });
        });
    });

    test("POST /api/auth/register should create a new user with token", async () => {
        const uniqueEmail = `test.dispatcher.${Date.now()}@routeiq.com`;
        const res = await fetch(`${baseUrl}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Test Dispatcher",
                email: uniqueEmail,
                password: "securePassword123",
                role: "dispatcher"
            })
        });

        assert.equal(res.status, 201);
        const data = await res.json();
        assert.ok(data.token);
        assert.equal(data.user.role, "dispatcher");
        assert.equal(data.user.email, uniqueEmail);
        dispatcherToken = data.token;
    });

    test("POST /api/auth/register should reject duplicate email with 409", async () => {
        const email = "duplicate@routeiq.com";
        await fetch(`${baseUrl}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "User 1",
                email,
                password: "password123",
                role: "dispatcher"
            })
        });

        const res2 = await fetch(`${baseUrl}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "User 2",
                email,
                password: "password123",
                role: "dispatcher"
            })
        });

        assert.equal(res2.status, 409);
        const data2 = await res2.json();
        assert.ok(data2.error.includes("already exists"));
    });

    test("POST /api/auth/login should authenticate valid credentials and issue JWT", async () => {
        const email = `login.test.${Date.now()}@routeiq.com`;
        await fetch(`${baseUrl}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Login Driver",
                email,
                password: "driverPassword123",
                role: "driver"
            })
        });

        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                password: "driverPassword123"
            })
        });

        assert.equal(loginRes.status, 200);
        const loginData = await loginRes.json();
        assert.ok(loginData.token);
        assert.equal(loginData.user.role, "driver");
        driverToken = loginData.token;
    });

    test("POST /api/auth/login should reject incorrect password with 401", async () => {
        const res = await fetch(`${baseUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "dispatcher@routeiq.com",
                password: "wrongpassword"
            })
        });

        assert.equal(res.status, 401);
    });

    test("POST /api/stops should reject unauthenticated request with 401", async () => {
        const res = await fetch(`${baseUrl}/stops`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Unauthorized Stop",
                position: [40.75, -73.98]
            })
        });

        assert.equal(res.status, 401);
    });

    test("POST /api/stops should reject driver role with 403 Forbidden", async () => {
        const res = await fetch(`${baseUrl}/stops`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${driverToken}`
            },
            body: JSON.stringify({
                name: "Forbidden Driver Stop",
                position: [40.75, -73.98]
            })
        });

        assert.equal(res.status, 403);
    });

    test("POST /api/stops should allow dispatcher role with 201 Created", async () => {
        const res = await fetch(`${baseUrl}/stops`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${dispatcherToken}`
            },
            body: JSON.stringify({
                name: "Times Square Delivery",
                position: [40.7580, -73.9855],
                priority: "urgent"
            })
        });

        assert.equal(res.status, 201);
        const data = await res.json();
        assert.equal(data.name, "Times Square Delivery");
    });

    after(async () => {
        if (server.closeAllConnections) {
            server.closeAllConnections();
        }
        await new Promise((resolve) => server.close(resolve));
    });
});
