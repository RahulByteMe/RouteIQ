import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/constants.js";
import userRepository from "../db/repositories/userRepository.js";

// ─── Authentication & RBAC Middleware ──────────────────────────────────────
//
// 1. requireAuth: Verifies JWT token and attaches user payload to req.user
// 2. requireRole: Restricts endpoint access by role ('dispatcher' vs 'driver')
// ───────────────────────────────────────────────────────────────────────────

export const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "Authentication required. Please provide a valid Bearer token."
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach user info to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            name: decoded.name
        };

        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Session expired. Please log in again." });
        }
        return res.status(401).json({ error: "Invalid or corrupted authentication token." });
    }
};

export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required." });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Access forbidden: ${req.user.role} role is not authorized for this operation. Required: [${allowedRoles.join(", ")}]`
            });
        }

        next();
    };
};

export default {
    requireAuth,
    requireRole
};
