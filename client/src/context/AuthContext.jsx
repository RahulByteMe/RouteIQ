import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const API_BASE = "http://127.0.0.1:4000/api";

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("routeiq_token"));
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("routeiq_user");
        return saved ? JSON.parse(saved) : null;
    });
    const [isLoading, setIsLoading] = useState(true);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("routeiq_token");
        localStorage.removeItem("routeiq_user");
    }, []);

    // Verify token with backend /api/auth/me on initial mount
    useEffect(() => {
        async function verifyUser() {
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                    localStorage.setItem("routeiq_user", JSON.stringify(data.user));
                } else {
                    logout();
                }
            } catch (err) {
                console.warn("Auth verification network error, keeping cached state:", err);
            } finally {
                setIsLoading(false);
            }
        }

        verifyUser();
    }, [token, logout]);

    const login = async (email, password) => {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Login failed.");
        }

        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("routeiq_token", data.token);
        localStorage.setItem("routeiq_user", JSON.stringify(data.user));
        return data.user;
    };

    const register = async (name, email, password, role = "dispatcher") => {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, role })
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || "Registration failed.");
        }

        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("routeiq_token", data.token);
        localStorage.setItem("routeiq_user", JSON.stringify(data.user));
        return data.user;
    };

    const getAuthHeaders = () => {
        const activeToken = token || localStorage.getItem("routeiq_token");
        return activeToken ? { Authorization: `Bearer ${activeToken}` } : {};
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                isAuthenticated: !!user && !!token,
                login,
                register,
                logout,
                getAuthHeaders
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export default AuthContext;
