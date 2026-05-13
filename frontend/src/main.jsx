import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { JobProvider } from './context/JobContext.jsx'
import { WorkerProvider } from './context/WorkerContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { ToastProvider } from './components/common/Toast.jsx'
import './index.css'

import { GoogleOAuthProvider } from '@react-oauth/google'

// Google OAuth Client ID - Auto-detect based on environment
const getGoogleClientId = () => {
    // Use explicit env variable if set
    if (import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your_google_client_id') {
        return import.meta.env.VITE_GOOGLE_CLIENT_ID
    }

    // Auto-detect based on hostname
    const hostname = window.location.hostname
    const clientIds = {
        'localhost': '795300979279-gk79g7cuv6k5qkcraqml0evo50m5ek73.apps.googleusercontent.com',
        '127.0.0.1': '795300979279-gk79g7cuv6k5qkcraqml0evo50m5ek73.apps.googleusercontent.com',
        '3.94.69.229': '795300979279-gk79g7cuv6k5qkcraqml0evo50m5ek73.apps.googleusercontent.com',
    }

    return clientIds[hostname] || '795300979279-gk79g7cuv6k5qkcraqml0evo50m5ek73.apps.googleusercontent.com'
}

const GOOGLE_CLIENT_ID = getGoogleClientId()

// Error boundary for catching render errors
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('React Error Boundary caught:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', color: 'red' }}>
                    <h1>Something went wrong</h1>
                    <pre>{this.state.error?.toString()}</pre>
                </div>
            )
        }
        return this.props.children
    }
}

try {
    console.log('Starting React app initialization...')
    ReactDOM.createRoot(document.getElementById('root')).render(
        <React.StrictMode>
            <ErrorBoundary>
                <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                    <BrowserRouter>
                        <LanguageProvider>
                            <ToastProvider>
                                <AuthProvider>
                                    <NotificationProvider>
                                        <JobProvider>
                                            <WorkerProvider>
                                                <App />
                                            </WorkerProvider>
                                        </JobProvider>
                                    </NotificationProvider>
                                </AuthProvider>
                            </ToastProvider>
                        </LanguageProvider>
                    </BrowserRouter>
                </GoogleOAuthProvider>
            </ErrorBoundary>
        </React.StrictMode>,
    )
    console.log('React app initialization complete')
} catch (error) {
    console.error('Fatal error during React initialization:', error)
    document.getElementById('root').innerHTML = '<div style="color: red; padding: 20px;"><h1>App Failed to Load</h1><pre>' + error.toString() + '</pre></div>'
}

