import { Navigate } from "react-router-dom";

const isLoggedIn = true;

function ProtectedRoute({ children }) {
    return(
        isLoggedIn ? children : <Navigate to="/login" replace />
    )
}

export default ProtectedRoute;