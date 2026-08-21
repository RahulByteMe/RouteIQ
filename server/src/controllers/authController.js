import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/constants.js";
import userRepository from "../db/repositories/userRepository.js";

// ─── Authentication Controller ─────────────────────────────────────────────

export const register = async (req, res) => {
    try {
        const { name, email, password, role = "dispatcher" } = req.body;

        // Validation
        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ error: "Name is required." });
        }
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ error: "A valid email address is required." });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long." });
        }
        if (!["dispatcher", "driver"].includes(role)) {
            return res.status(400).json({ error: "Role must be either 'dispatcher' or 'driver'." });
        }

        // Check if user already exists
        const existing = await userRepository.findByEmail(email);
        if (existing) {
            return res.status(409).json({ error: "An account with this email already exists." });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await userRepository.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            passwordHash,
            role
        });

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Registration failed", details: err.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const user = await userRepository.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Login failed", details: err.message });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await userRepository.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch user profile", details: err.message });
    }
};

export default {
    register,
    login,
    getMe
};
