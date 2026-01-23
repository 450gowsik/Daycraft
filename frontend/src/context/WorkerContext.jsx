import { createContext, useContext, useState, useEffect } from 'react'
import demoWorkers from '../data/demoWorkers.json'

const WorkerContext = createContext()
const API_URL = 'http://localhost:5000/api'

export function WorkerProvider({ children }) {
    const [workers, setWorkers] = useState([])
    const [filteredWorkers, setFilteredWorkers] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchWorkers()
    }, [])

    useEffect(() => {
        applyFilters()
    }, [workers, searchQuery])

    const fetchWorkers = async () => {
        setLoading(true)
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800))

            // Normalize demo data to match component expectations
            const normalizedWorkers = demoWorkers.map(w => ({
                ...w,
                _id: w.id, // Components expect _id
                skills: [w.skill], // Components expect array of skills
                idVerified: w.verified,
                phoneVerified: w.verified,
                locationVerified: w.verified,
                availability: w.available ? 'available' : 'unavailable'
            }))

            setWorkers(normalizedWorkers)
        } catch (err) {
            setError('Failed to fetch workers')
            console.error('Failed to fetch workers:', err)
        } finally {
            setLoading(false)
        }
    }

    const applyFilters = () => {
        let result = workers

        // ✅ ONLY show fully verified workers
        result = result.filter(worker => worker.idVerified)

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(worker => {
                const name = worker.name?.toLowerCase() || ''
                const bio = worker.bio?.toLowerCase() || ''
                const location = worker.location?.toLowerCase() || ''

                // Handle skills that can be strings or objects with en/ta properties
                const skillsText = worker.skills?.map(s => {
                    if (typeof s === 'string') return s.toLowerCase()
                    return `${s?.en || ''} ${s?.ta || ''}`.toLowerCase()
                }).join(' ') || ''

                return name.includes(query) ||
                    bio.includes(query) ||
                    location.includes(query) ||
                    skillsText.includes(query)
            })
        }

        setFilteredWorkers(result)
    }

    const reloadWorkers = () => fetchWorkers()

    return (
        <WorkerContext.Provider value={{
            workers,
            filteredWorkers,
            searchQuery,
            setSearchQuery,
            loading,
            error,
            reloadWorkers
        }}>
            {children}
        </WorkerContext.Provider>
    )
}

export function useWorkers() {
    const context = useContext(WorkerContext)
    if (!context) {
        throw new Error('useWorkers must be used within a WorkerProvider')
    }
    return context
}
