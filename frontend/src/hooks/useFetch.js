/**
 * useFetch Hook
 * Generic data fetching hook with loading/error states
 */
import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for data fetching
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Object} { data, loading, error, refetch }
 */
export function useFetch(url, options = {}) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.message || 'Request failed')
            }

            setData(result)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [url, JSON.stringify(options)])

    useEffect(() => {
        if (url) {
            fetchData()
        }
    }, [url, fetchData])

    return { data, loading, error, refetch: fetchData }
}

/**
 * useFetch with authentication
 * @param {string} url - API endpoint
 * @param {string} token - Auth token
 * @param {Object} options - Fetch options
 */
export function useAuthFetch(url, token, options = {}) {
    return useFetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            ...options.headers
        }
    })
}

export default useFetch
