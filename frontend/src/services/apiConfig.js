const normalizeApiBaseUrl = (value) => {
    const trimmed = value?.trim()

    if (!trimmed) {
        return '/api'
    }

    return trimmed.replace(/\/+$/, '') || '/api'
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL)

export const buildApiUrl = (path = '') => {
    if (!path) {
        return API_BASE_URL
    }

    return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
