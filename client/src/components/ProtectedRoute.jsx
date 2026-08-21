import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
    const { user, isAuthenticated, isLoading, login } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-60px)] bg-gray-950 text-gray-100">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-gray-400 font-mono">Loading RouteIQ session...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-60px)] bg-gray-950 text-gray-100 p-4">
                <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-700/60 text-2xl flex items-center justify-center mx-auto">
                        🔐
                    </div>
                    <h2 className="text-lg font-bold text-white">
                        Authentication Required
                    </h2>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Please sign in or enter with a single click using our pre-seeded demo account.
                    </p>
                    <div className="pt-2 flex flex-col gap-2">
                        <button
                            onClick={() => login("dispatcher@routeiq.com", "password123")}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                            👔 Enter as Demo Dispatcher →
                        </button>
                        <Link
                            to="/login"
                            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl transition-colors"
                        >
                            Go to Login Page
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Role-based access check
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-60px)] bg-gray-950 text-gray-100 p-4">
                <div className="max-w-md w-full bg-gray-900 border border-rose-800/80 rounded-2xl p-6 shadow-2xl text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-950 border border-rose-700/60 text-2xl flex items-center justify-center mx-auto">
                        🚫
                    </div>
                    <h2 className="text-lg font-bold text-white">
                        Access Restricted ({user.role.toUpperCase()})
                    </h2>
                    <p className="text-xs text-gray-300 leading-relaxed">
                        Your account has the <strong className="text-rose-400 font-mono">{user.role}</strong> role. 
                        This portal requires: <span className="text-blue-400 font-mono font-semibold">{allowedRoles.join(", ")}</span>.
                    </p>
                    <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2">
                        <button
                            onClick={() => login("dispatcher@routeiq.com", "password123")}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                            Switch to Dispatcher Mode 👔
                        </button>
                        <Link
                            to="/driver"
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-lg transition-colors"
                        >
                            Go to Driver Console →
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return children;
}

export default ProtectedRoute;