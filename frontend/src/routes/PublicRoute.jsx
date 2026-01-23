
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function PublicRoute({ children }) {
    const { isAuthenticated, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
            </div>
        )
    }

    if (isAuthenticated) {
        // User is already logged in, redirect them away from auth pages
        // If they were redirected here from somewhere else, go back there?
        // Or default to Home/Dashboard.
        // The user request says "Redirect the user directly to the Home page".
        return <Navigate to="/" replace />
    }

    return children
}

export default PublicRoute
