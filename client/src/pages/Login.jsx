import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError("");

        if (!email.trim() || !password.trim()) {
            setError("Please enter both email and password.");
            return;
        }

        setIsSubmitting(true);
        try {
            const user = await login(email, password);
            if (user.role === "dispatcher") {
                navigate("/dispatcher");
            } else {
                navigate("/driver");
            }
        } catch (err) {
            setError(err.message || "Invalid email or password.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const fillDemoAccount = (demoEmail, demoPassword) => {
        setEmail(demoEmail);
        setPassword(demoPassword);
        setError("");
    };

    return (
        <div className="min-h-[calc(100vh-150px)] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl space-y-6">
                
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-2xl mb-1">
                        ⚡
                    </div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                        Welcome to RouteIQ
                    </h1>
                    <p className="text-xs text-gray-400">
                        Sign in to access your dispatch dashboard & navigation
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs px-3.5 py-2.5 rounded-lg">
                        ⚠️ {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Email */}
                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            placeholder="e.g. dispatcher@routeiq.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                        <span>{isSubmitting ? "Signing in..." : "Sign In →"}</span>
                    </button>

                </form>

                {/* Demo Accounts Helper */}
                <div className="pt-3 border-t border-gray-800 space-y-2">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">
                        ⚡ Quick Demo Sign-In
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => fillDemoAccount("dispatcher@routeiq.com", "password123")}
                            className="py-2 px-2 bg-gray-950 border border-blue-500/30 hover:bg-blue-950/40 text-blue-300 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer text-center"
                        >
                            👔 Dispatcher Demo
                        </button>
                        <button
                            type="button"
                            onClick={() => fillDemoAccount("driver@routeiq.com", "password123")}
                            className="py-2 px-2 bg-gray-950 border border-emerald-500/30 hover:bg-emerald-950/40 text-emerald-300 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer text-center"
                        >
                            🚚 Driver Demo
                        </button>
                    </div>
                </div>

                {/* Footer Link */}
                <div className="text-center pt-2 border-t border-gray-800/80">
                    <p className="text-xs text-gray-400">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold underline">
                            Create Account
                        </Link>
                    </p>
                </div>

            </div>
        </div>
    );
}

export default Login;