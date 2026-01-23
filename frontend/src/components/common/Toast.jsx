import { useState, useEffect, createContext, useContext } from 'react'
import './Toast.css'

// Toast Context for global access
const ToastContext = createContext()

export function useToast() {
    return useContext(ToastContext)
}

// Toast Item Component
function ToastItem({ toast, onRemove }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id)
        }, toast.duration || 4000)
        return () => clearTimeout(timer)
    }, [toast.id, toast.duration, onRemove])

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️',
        celebrate: '🎉'
    }

    return (
        <div className={`toast toast-${toast.type}`}>
            <div className="toast-icon">
                {icons[toast.type] || icons.info}
            </div>
            <div className="toast-content">
                <p className="toast-message">{toast.message}</p>
                {toast.submessage && (
                    <p className="toast-submessage">{toast.submessage}</p>
                )}
            </div>
            <button className="toast-close" onClick={() => onRemove(toast.id)}>✕</button>

            {/* Progress bar for auto-dismiss */}
            <div
                className="toast-progress"
                style={{ animationDuration: `${toast.duration || 4000}ms` }}
            />
        </div>
    )
}

// Toast Provider Component
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = (message, type = 'success', options = {}) => {
        const id = Date.now()
        const newToast = {
            id,
            message,
            type,
            submessage: options.submessage,
            duration: options.duration || 4000
        }
        setToasts(prev => [...prev, newToast])
        return id
    }

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    // Convenience methods
    const toast = {
        success: (msg, opts) => addToast(msg, 'success', opts),
        error: (msg, opts) => addToast(msg, 'error', opts),
        info: (msg, opts) => addToast(msg, 'info', opts),
        warning: (msg, opts) => addToast(msg, 'warning', opts),
        celebrate: (msg, opts) => addToast(msg, 'celebrate', { duration: 5000, ...opts })
    }

    return (
        <ToastContext.Provider value={toast}>
            {children}

            {/* Toast Container */}
            <div className="toast-container">
                {toasts.map(t => (
                    <ToastItem key={t.id} toast={t} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export default ToastProvider
