import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("dispatcher");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Please enter your name.");
            return;
        }
        if (!email.trim()) {
            setError("Please enter your email.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setIsSubmitting(true);
        try {
            const user = await register(name, email, password, role);
            if (user.role === "dispatcher") {
                navigate("/dispatcher");
            } else {
                navigate("/driver");
            }
        } catch (err) {
            setError(err.message || "Registration failed.");
        } finally {
            setIsSubmitting(false);
        }
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
                        Create RouteIQ Account
                    </h1>
                    <p className="text-xs text-gray-400">
                        Join the next-generation logistics & dispatch platform
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
                    
                    {/* Role Selector */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                            Account Role
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setRole("dispatcher")}
                                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    role === "dispatcher"
                                        ? "bg-blue-600/30 border-blue-500 text-blue-300 shadow-sm"
                                        : "bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800"
                                }`}
                            >
                                <span>👔</span>
                                <span>Dispatcher</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole("driver")}
                                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    role === "driver"
                                        ? "bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-sm"
                                        : "bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800"
                                }`}
                            >
                                <span>🚚</span>
                                <span>Driver</span>
                            </button>
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                            Full Name
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Rahul Yadav"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            placeholder="e.g. rahul@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                            Password (min. 6 characters)
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
                        <span>{isSubmitting ? "Creating Account..." : "Register Account →"}</span>
                    </button>

                </form>

                {/* Footer Link */}
                <div className="text-center pt-2 border-t border-gray-800/80">
                    <p className="text-xs text-gray-400">
                        Already have an account?{" "}
                        <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold underline">
                            Log in
                        </Link>
                    </p>
                </div>

            </div>
        </div>
    );
}

export default Register;
