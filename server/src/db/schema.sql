-- ─── RouteIQ Database Schema (PostgreSQL) ──────────────────────────────────
--
-- Entities:
--   1. users: Dispatchers and Drivers with secure authentication roles
--   2. depots: Starting and returning hubs for delivery routes
--   3. stops: Individual delivery locations with coordinates and priority
--   4. routes: Published delivery tours with optimization metadata
--   5. route_stops: Ordered stop sequence per route with delivery progress
--   6. telemetry_events: Live GPS location breadcrumbs for audit and replay
-- ───────────────────────────────────────────────────────────────────────────

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('dispatcher', 'driver')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Depots Table
CREATE TABLE IF NOT EXISTS depots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL DEFAULT 'Manhattan Central Hub',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Stops Table
CREATE TABLE IF NOT EXISTS stops (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    priority VARCHAR(20) DEFAULT 'standard' CHECK (priority IN ('standard', 'urgent', 'flexible')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Routes Table
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    depot_id INT REFERENCES depots(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'optimized', 'assigned', 'in_progress', 'completed')),
    total_distance DOUBLE PRECISION DEFAULT 0,
    estimated_duration DOUBLE PRECISION DEFAULT 0,
    naive_distance DOUBLE PRECISION DEFAULT 0,
    savings_percent DOUBLE PRECISION DEFAULT 0,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    assigned_driver_id INT REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Route Stops Join Table (preserves sequence and completion)
CREATE TABLE IF NOT EXISTS route_stops (
    id SERIAL PRIMARY KEY,
    route_id INT REFERENCES routes(id) ON DELETE CASCADE,
    stop_id INT REFERENCES stops(id) ON DELETE CASCADE,
    sequence INT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_route_stop UNIQUE (route_id, stop_id),
    CONSTRAINT unique_route_sequence UNIQUE (route_id, sequence)
);

-- 6. Telemetry Events (Rolling Breadcrumbs)
CREATE TABLE IF NOT EXISTS telemetry_events (
    id SERIAL PRIMARY KEY,
    route_id INT REFERENCES routes(id) ON DELETE CASCADE,
    driver_id INT REFERENCES users(id) ON DELETE SET NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    heading DOUBLE PRECISION DEFAULT 0,
    speed DOUBLE PRECISION DEFAULT 0,
    is_deviated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── Indexes for High-Performance Queries ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_stops_created_by ON stops(created_by);
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);
CREATE INDEX IF NOT EXISTS idx_route_stops_route_id ON route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_sequence ON route_stops(route_id, sequence);
CREATE INDEX IF NOT EXISTS idx_telemetry_route ON telemetry_events(route_id, created_at DESC);
