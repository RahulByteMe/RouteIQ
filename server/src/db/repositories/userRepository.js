import bcrypt from "bcryptjs";
import { query, isDbConnected } from "../connection.js";

// ─── User Repository (Unified PostgreSQL + In-Memory Access) ───────────────

// Pre-seeded demo accounts (password: "password123")
const DEMO_PASSWORD_HASH = bcrypt.hashSync("password123", 10);

const memoryUsers = [
    {
        id: 1,
        name: "Rahul Dispatcher",
        email: "dispatcher@routeiq.com",
        password_hash: DEMO_PASSWORD_HASH,
        role: "dispatcher",
        created_at: new Date().toISOString()
    },
    {
        id: 2,
        name: "Alex Driver",
        email: "driver@routeiq.com",
        password_hash: DEMO_PASSWORD_HASH,
        role: "driver",
        created_at: new Date().toISOString()
    }
];

export const userRepository = {
    async findByEmail(email) {
        const normalizedEmail = email.trim().toLowerCase();
        if (isDbConnected()) {
            const res = await query("SELECT * FROM users WHERE LOWER(email) = $1", [normalizedEmail]);
            return res.rows[0] || null;
        }
        return memoryUsers.find((u) => u.email.toLowerCase() === normalizedEmail) || null;
    },

    async findById(id) {
        if (isDbConnected()) {
            const res = await query("SELECT id, name, email, role, created_at FROM users WHERE id = $1", [id]);
            return res.rows[0] || null;
        }
        const user = memoryUsers.find((u) => u.id === Number(id));
        if (!user) return null;
        const { password_hash: _, ...safeUser } = user;
        return safeUser;
    },

    async create({ name, email, passwordHash, role = "dispatcher" }) {
        const normalizedEmail = email.trim().toLowerCase();
        if (isDbConnected()) {
            const res = await query(
                `INSERT INTO users (name, email, password_hash, role)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, name, email, role, created_at`,
                [name.trim(), normalizedEmail, passwordHash, role]
            );
            return res.rows[0];
        }

        const newUser = {
            id: memoryUsers.length + 1,
            name: name.trim(),
            email: normalizedEmail,
            password_hash: passwordHash,
            role,
            created_at: new Date().toISOString()
        };
        memoryUsers.push(newUser);
        const { password_hash: _, ...safeUser } = newUser;
        return safeUser;
    }
};

export default userRepository;
