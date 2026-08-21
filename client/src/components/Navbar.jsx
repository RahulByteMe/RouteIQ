import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { socket } from "../services/socket";
import { useAuth } from "../context/AuthContext";

function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        function onConnect() {
            setIsConnected(true);
        }
        function onDisconnect() {
            setIsConnected(false);
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
        };
    }, []);

    const navLinks = [
        { path: "/", label: "🏠 Overview" },
        { path: "/dispatcher", label: "📋 Dispatcher", role: "dispatcher" },
        { path: "/driver", label: "🚚 Driver View", role: "driver" },
    ];

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-gray-800/80 px-4 lg:px-8 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                
                {/* Brand */}
                <Link to="/" className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-base shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                        ⚡
                    </div>
                    <div>
                        <span className="text-white font-extrabold text-base tracking-tight group-hover:text-blue-400 transition-colors">
                            RouteIQ
                        </span>
                        <span className="hidden sm:inline-block text-[10px] text-gray-400 font-mono ml-2 border border-gray-700/60 rounded px-1.5 py-0.5">
                            v1.0
                        </span>
                    </div>
                </Link>

                {/* Desktop Navigation Links */}
                <nav className="hidden md:flex items-center gap-2">
                    {navLinks.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    isActive
                                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10"
                                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
                                }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Auth Pill & Server Status */}
                <div className="flex items-center gap-2.5">
                    
                    {/* WebSocket Status */}
                    <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                        isConnected
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                            : "bg-amber-950/60 text-amber-300 border-amber-800/60"
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
                        <span>{isConnected ? "WS Live" : "WS Reconnecting"}</span>
                    </div>

                    {/* Authenticated User Status / Login Buttons */}
                    {isAuthenticated && user ? (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-900 border border-gray-800 rounded-lg text-xs font-medium text-gray-300">
                                <span>{user.role === "dispatcher" ? "👔" : "🚚"}</span>
                                <span className="font-bold text-white max-w-[100px] truncate">{user.name}</span>
                                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-blue-900/50 text-blue-300 border border-blue-700/50">
                                    {user.role}
                                </span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="px-2.5 py-1 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 rounded-lg transition-colors cursor-pointer"
                                title="Sign out"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                to="/login"
                                className="px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800/60 rounded-lg transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
                            >
                                Register
                            </Link>
                        </div>
                    )}

                    {/* Mobile Hamburger Toggle */}
                    <button
                        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                        className="md:hidden p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white cursor-pointer"
                        aria-label="Toggle navigation menu"
                    >
                        <span className="text-base">{isMobileMenuOpen ? "✕" : "☰"}</span>
                    </button>
                </div>

            </div>

            {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden mt-3 pt-3 border-t border-gray-800 flex flex-col gap-1.5">
                    {navLinks.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                    isActive
                                        ? "bg-blue-600 text-white shadow"
                                        : "text-gray-300 hover:bg-gray-800"
                                }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </header>
    );
}

export default Navbar;