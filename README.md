# RouteIQ — Intelligent Delivery & Logistics Route Optimizer

[![Build & Tests](https://img.shields.io/badge/Tests-35%20Passed-emerald.svg)](#-automated-testing)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)](#)
[![Stack](https://img.shields.io/badge/Stack-React%2019%20%7C%20Node%2022%20%7C%20PostgreSQL-indigo.svg)](#)
[![Region](https://img.shields.io/badge/Region-India%20Logistics%20Hubs-orange.svg)](#)
[![Author](https://img.shields.io/badge/Engineered%20by-Rahul%20Yadav-purple.svg)](#)

> **RouteIQ** is a production-grade, real-time logistics and delivery route optimization platform engineered from first principles for Indian metropolitan commercial hubs. It solves the multi-stop Traveling Salesperson Problem (TSP) for last-mile delivery fleets using self-implemented heuristics ($O(N^2)$ Nearest Neighbor + $O(N^3)$ 2-Opt local search) combined with real OSRM road-network distance matrices, PostgreSQL database storage, JWT Role-Based Access Control (RBAC), and bidirectional WebSocket telemetry.

---

## 🇮🇳 Indian Metropolitan Logistics Hubs

RouteIQ comes pre-configured with curated delivery zones across India's largest commercial & technology centers:

1. 🏛️ **Delhi NCR** — Connaught Place Hub, Karol Bagh, Lajpat Nagar, Nehru Place, Cyber City Gurugram, Noida Sector 18, Chandni Chowk, Okhla Industrial Area
2. 💻 **Bengaluru (Silicon Valley)** — MG Road Central Hub, Indiranagar 100ft Road, Koramangala 4th Block, Whitefield ITPL, Electronic City Phase 1, HSR Layout, Jayanagar
3. 🌊 **Mumbai (Financial Capital)** — BKC (Bandra Kurla Complex), Nariman Point, Lower Parel, Andheri East MIDC, Powai Hiranandani, Dadar TT, Bandra Linking Road
4. 💎 **Hyderabad (Cyberabad)** — HITEC City Cyber Towers, Gachibowli Financial District, Banjara Hills, Jubilee Hills, Madhapur, Secunderabad
5. 🏰 **Pune (Automotive & IT Hub)** — Shivajinagar Central Dispatch, Hinjewadi IT Park, Viman Nagar, Koregaon Park, Kothrud, Magarpatta City
6. 🏖️ **Chennai (Gateway of South)** — T. Nagar Panagal Park, OMR IT Expressway, Guindy Industrial Estate, Anna Nagar, Adyar, Mylapore
7. 🚋 **Kolkata (Eastern Hub)** — Park Street Central Dispatch, Salt Lake Sector V, New Town Action Area 1, Howrah Station Yard, Ballygunge Phari

---

## 🚀 Key Features

- **100% Backend Database Storage:** All stops, hubs, routes, and user accounts are persisted directly in PostgreSQL via a modular Data Access Layer (DAL) — zero reliance on browser `localStorage`.
- **Self-Implemented Algorithmic TSP Engine:** Priority-aware Nearest-Neighbor construction + 2-Opt local search untangling crossing edges in $O(N^3)$ time, delivering **$21.1\% - 75.2\%$ average distance reduction** in under **$28.5\text{ms}$**.
- **OSRM Road-Network Distance Matrix with LRU Caching:** Evaluates routes based on actual driving distances and turn restrictions (via OSRM Table API) with in-memory caching and automatic fallback to geodesic Haversine distance.
- **Sub-Second Real-Time Telemetry:** Bi-directional Socket.IO WebSocket pipeline streaming vehicle coordinates, speed, heading, and 250m auto-arrival stop check-offs.
- **Cross-Track Deviation & Dynamic Re-Routing:** Perpendicular point-to-segment distance algorithm detecting when a vehicle veers $> 500\text{m}$ off the scheduled road polyline with 1-click dynamic re-optimization.
- **JWT Authentication & Role-Based Access Control (RBAC):** `bcryptjs` password encryption with signed JWT bearer tokens protecting dispatcher-only administrative mutations while isolating driver capabilities.
- **Automated Test Suite:** 35 unit and integration tests passing cleanly across client (Vitest) and server (`node:test`).
- **Green Logistics / ESG Estimator & Manifest Exporter:** Calculates $CO_2$ emissions avoided (kg) and fuel saved (L) alongside one-click UTF-8 CSV manifest downloads, clipboard copy, and print-to-PDF.

---

## 📊 Measured Benchmark Results (Multi-Dataset Empirical Evaluation)

Across **50 deterministic datasets** (10 seeds × 5 stop counts), RouteIQ's self-implemented Nearest-Neighbor + 2-Opt heuristic achieved:

- **21.1% – 75.2%** average distance reduction depending on stop count
- **4.5%** minimum observed reduction
- **77.9%** maximum observed reduction
- **28.49 ms** average optimization time for 50-stop datasets
- **All tested configurations** remained well below the 2-second PRD latency target

```
========================================================================================================================
📊 AGGREGATE PERFORMANCE SUMMARY (Averaged across 10 Datasets × 100 Timing Iterations per Stop Count)
========================================================================================================================
Stops | Avg Naive | Avg NN    | Avg 2-Opt  | Avg Reduc % | Min Reduc % | Max Reduc % | Avg NN (ms) | Avg 2-Opt (ms) | Total (ms) | PRD Valid
------------------------------------------------------------------------------------------------------------------------
5     | 44.80 km  | 38.32 km  | 35.26 km   | +21.1%      | +4.5%       | +28.3%      | 0.002       | 0.005          | 0.006      | ✅ PASS
10    | 90.52 km  | 58.99 km  | 47.97 km   | +46.1%      | +33.5%      | +58.8%      | 0.003       | 0.055          | 0.057      | ✅ PASS
20    | 178.67 km | 98.79 km  | 70.18 km   | +60.6%      | +55.8%      | +66.1%      | 0.009       | 0.803          | 0.812      | ✅ PASS
30    | 267.92 km | 112.56 km | 81.96 km   | +69.1%      | +63.7%      | +72.5%      | 0.019       | 3.506          | 3.525      | ✅ PASS
50    | 422.38 km | 153.05 km | 103.98 km  | +75.2%      | +70.4%      | +77.9%      | 0.060       | 28.427         | 28.488     | ✅ PASS
========================================================================================================================
• Distance Reduction Formula: ((naiveDistance - twoOptDistance) / naiveDistance) * 100 [Positive = distance reduced]
• Time Measurement         : Node.js perf_hooks.performance.now() averaged across 100 timing runs per dataset
• Reproducibility          : Seeded Mulberry32 PRNG (Seeds 1001-1010) guarantees identical coordinates across runs
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

### Reproducible Multi-Dataset Algorithmic Benchmark
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
