import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Home from "../pages/Home";
import Driver from "../pages/Driver";
import Dispatcher from "../pages/Dispatcher";
import NotFound from "../pages/NotFound";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import ProtectedRoute from "../components/ProtectedRoute";

// ─── Frontend Page Router (React Router v7) ────────────────────────────────
//
// WHAT THIS DOES:
//   Maps browser URLs (client-side routes) to React page components and
//   applies Role-Based ProtectedRoute guards.
// ───────────────────────────────────────────────────────────────────────────

export function AppRoutes() {
    return (
        <Routes>
            {/* Main Application Layout (Navbar + Content) */}
            <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                
                {/* Dispatcher Portal - Restricted to Dispatchers */}
                <Route
                    path="/dispatcher"
                    element={
                        <ProtectedRoute allowedRoles={["dispatcher"]}>
                            <Dispatcher />
                        </ProtectedRoute>
                    }
                />

                {/* Driver Portal - Accessible to Drivers and Dispatchers */}
                <Route
                    path="/driver"
                    element={
                        <ProtectedRoute allowedRoles={["driver", "dispatcher"]}>
                            <Driver />
                        </ProtectedRoute>
                    }
                />
            </Route>

            {/* Auth Layout (Login & Register Screens) */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default AppRoutes;
