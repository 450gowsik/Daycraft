import { useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { toast } from 'react-hot-toast'

// Helper component to handle redirection with a side-effect toast
function RedirectWithToast({ to, message }) {
    const navigate = useNavigate()
    useEffect(() => {
        toast.error(message)
        navigate(to, { replace: true })
    }, [navigate, to, message])
    return null
}

function ProtectedRoute({ children, roles }) {
    const { isAuthenticated, user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        )
    }

    if (!isAuthenticated) {
        // Redirect to login, preserving the intended destination
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    // Profile completion guard - redirect incomplete profiles
    // Allow access to /complete-profile to prevent infinite redirect loop
    const allowedBeforeProfileCompletion = new Set([
        '/complete-profile',
        '/dashboard',
        '/profile',
        '/wallet'
    ])

    if (!user?.profileCompleted && !allowedBeforeProfileCompletion.has(location.pathname)) {
        return <Navigate to="/complete-profile" replace />
    }

    // Phone verification guard for specific routes
    if (children.props?.requirePhoneVerified && user?.role === 'worker' && !user?.phoneVerified) {
        // Redirect to dashboard where the verification banner is visible
        return <Navigate to="/" replace />
    }

    // Check role authorization if roles are specified
    // Supports both multi-role (user.roles) and backward compatibility (user.role)
    if (roles && roles.length > 0) {
        const userRoles = user?.roles || (user?.role ? [user.role] : [])
        const hasPermission = userRoles.some(r => roles.includes(r))

        if (!hasPermission) {
            return (
                <RedirectWithToast
                    to="/"
                    message="Only employers can post jobs! / முதலாளிகள் மட்டுமே வேலைகளைப் பதிவு செய்ய முடியும்!"
                />
            )
        }
    }

    return children
}

export default ProtectedRoute
