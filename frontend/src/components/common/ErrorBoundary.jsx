import React from 'react'

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo)
        this.setState({ error, errorInfo })
    }

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div className="error-boundary-container" style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    minHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0f172a'
                }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: '#ef4444' }}>Something went wrong</h2>
                    <p style={{ color: '#64748b', marginBottom: '24px' }}>
                        We encountered an unexpected error. Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn-primary"
                        style={{
                            padding: '12px 24px',
                            background: '#14a800',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600'
                        }}
                    >
                        Refresh Page
                    </button>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details style={{ marginTop: '32px', textAlign: 'left', maxWidth: '800px', width: '100%', whiteSpace: 'pre-wrap', background: '#f1f5f9', padding: '16px', borderRadius: '8px', overflowX: 'auto' }}>
                            <summary style={{ cursor: 'pointer', marginBottom: '8px', fontWeight: '500' }}>Error Details</summary>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#dc2626' }}>{this.state.error.toString()}</span>
                            <br />
                            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>{this.state.errorInfo?.componentStack}</span>
                        </details>
                    )}
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
