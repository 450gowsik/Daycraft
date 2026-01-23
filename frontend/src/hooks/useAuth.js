/**
 * useAuth Hook
 * Re-exports auth context for cleaner imports
 */
import { useAuth as useAuthContext } from '../context/AuthContext.jsx'

// Re-export the hook for cleaner imports
export const useAuth = useAuthContext

export default useAuth
