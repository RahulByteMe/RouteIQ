# RouteIQ — Intelligent Delivery & Logistics Route Optimizer

[![Build & Tests](https://img.shields.io/badge/Tests-35%20Passed-emerald.svg)](#-automated-testing)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)](#)
[![Stack](https://img.shields.io/badge/Stack-React%2019%20%7C%20Node%2022%20%7C%20PostgreSQL-indigo.svg)](#)
[![Author](https://img.shields.io/badge/Engineered%20by-Rahul%20Yadav-purple.svg)](#)

> **RouteIQ** is a production-grade, real-time logistics and delivery route optimization platform built from first principles. It solves the multi-stop Traveling Salesperson Problem (TSP) for last-mile delivery fleets using self-implemented heuristics ($O(N^2)$ Nearest Neighbor + $O(N^3)$ 2-Opt local search) combined with real OSRM road-network distance matrices, PostgreSQL persistence, JWT Role-Based Access Control (RBAC), and bidirectional WebSocket telemetry.

---

## 🚀 Key Features

- **Self-Implemented Algorithmic TSP Engine:** Priority-aware Nearest-Neighbor construction + 2-Opt local search untangling crossing edges in $O(N^3)$ time, delivering **$16.2\% - 75.9\%$ distance reduction** in under **$15\text{ms}$**.
- **OSRM Road-Network Distance Matrix with LRU Caching:** Evaluates routes based on actual driving distances and turn restrictions (via OSRM Table API) with in-memory caching and automatic fallback to geodesic Haversine distance.
- **Sub-Second Real-Time Telemetry:** Bi-directional Socket.IO WebSocket pipeline streaming vehicle coordinates, speed, heading, and 250m auto-arrival stop check-offs.
- **Cross-Track Deviation & Dynamic Re-Routing:** Perpendicular point-to-segment distance algorithm detecting when a vehicle veers $> 500\text{m}$ off the scheduled road polyline with 1-click dynamic re-optimization.
- **PostgreSQL Relational Data Access Layer:** Normalized schema (`users`, `depots`, `stops`, `routes`, `route_stops`, `telemetry_events`) with strict sequence preservation and offline development fallback.
- **JWT Authentication & Role-Based Access Control (RBAC):** `bcryptjs` password encryption with signed JWT bearer tokens protecting dispatcher-only administrative mutations while isolating driver capabilities.
- **Automated Test Suite:** 35 unit and integration tests passing cleanly across client (Vitest) and server (`node:test`).
- **Green Logistics / ESG Estimator & Manifest Exporter:** Calculates $CO_2$ emissions avoided (kg) and fuel saved (L) alongside one-click UTF-8 CSV manifest downloads, clipboard copy, and print-to-PDF.

---

## 📊 Measured Benchmark Results (100 Iteration Averages)

```
=================================================================================================
🚀 ROUTEIQ ALGORITHM EMPIRICAL BENCHMARK (Multi-Iteration Average: 100 runs)
=================================================================================================
Stops | Naive (km) | NN (km) | 2-Opt (km) | Reduction % | NN Time (ms) | 2-Opt Time (ms) | Total (ms) | Swaps | PRD Valid
-------------------------------------------------------------------------------------------------
5     | 37.40      | 40.49   | 31.35      | -16.2%      | 0.004        | 0.031           | 0.035      | 5     | ✅ PASS
10    | 65.49      | 52.05   | 42.22      | -35.5%      | 0.005        | 0.062           | 0.067      | 8     | ✅ PASS
20    | 139.28     | 83.11   | 60.83      | -56.3%      | 0.010        | 0.646           | 0.656      | 18    | ✅ PASS
30    | 211.63     | 84.41   | 60.38      | -71.5%      | 0.020        | 4.141           | 4.161      | 18    | ✅ PASS
50    | 369.56     | 130.64  | 88.90      | -75.9%      | 0.056        | 14.276          | 14.332     | 33    | ✅ PASS
=================================================================================================
Formula: distanceReduction = ((naiveDistance - twoOptDistance) / naiveDistance) * 100
Command: npm run benchmark (in server/ directory)
```

---

## 🔑 Quick Demo Credentials

| Role | Email | Password | Allowed Access |
| :--- | :--- | :--- | :--- |
| **Dispatcher** | `dispatcher@routeiq.com` | `password123` | Full access to Dispatcher Hub, Stop Management, Route Publishing |
| **Driver** | `driver@routeiq.com` | `password123` | Driver Navigation Console, GPS Telemetry, Stop Check-offs |

---

## 🧪 Automated Testing

### Client Tests (19 tests)
```bash
cd client
npm test
```

### Server Tests (14 tests)
```bash
cd server
npm test
```

### Reproducible Algorithmic Benchmark
```bash
cd server
npm run benchmark
```

---

## 🛠️ Quick Start

```bash
# 1. Start Server
cd server
npm install
node server.js

# 2. Start Client
cd client
npm install
npm run dev
```

Or run via Docker Compose:
```bash
docker-compose up --build
```

---

*Built & Engineered by **Rahul Yadav**.*
