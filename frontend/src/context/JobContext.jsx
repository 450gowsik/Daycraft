import { createContext, useContext, useState, useEffect } from 'react'
import { buildApiUrl } from '../services/apiConfig'

const JobContext = createContext()

export function JobProvider({ children }) {
    const [jobs, setJobs] = useState([])
    const [categories, setCategories] = useState([])
    const [filteredJobs, setFilteredJobs] = useState([])
    // Location-first matching state
    const [rawPriorityJobs, setRawPriorityJobs] = useState([])
    const [rawOtherJobs, setRawOtherJobs] = useState([])
    const [priorityJobs, setPriorityJobs] = useState([])
    const [otherJobs, setOtherJobs] = useState([])
    const [useLocationMatching, setUseLocationMatching] = useState(false)

    const [selectedCategory, setSelectedCategory] = useState(null)
    const [selectedLocation, setSelectedLocation] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchCategories()
        fetchJobs()
    }, [])

    // Fetch location-matched jobs when location changes
    useEffect(() => {
        if (selectedLocation && selectedLocation.displayText) {
            fetchLocationMatchedJobs()
        } else {
            // Reset to normal mode when no location selected
            setUseLocationMatching(false)
            setRawPriorityJobs([])
            setRawOtherJobs([])
            setPriorityJobs([])
            setOtherJobs([])
        }
    }, [selectedLocation, selectedCategory])

    useEffect(() => {
        if (!useLocationMatching) {
            applyFilters()
        }
    }, [jobs, selectedCategory, selectedLocation, searchQuery, useLocationMatching])

    useEffect(() => {
        if (useLocationMatching) {
            let filteredP = rawPriorityJobs
            let filteredO = rawOtherJobs

            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const filterFn = job => {
                    const titleEn = job.title?.en?.toLowerCase() || ''
                    const titleTa = job.title?.ta?.toLowerCase() || ''
                    const descEn = job.description?.en?.toLowerCase() || ''
                    const descTa = job.description?.ta?.toLowerCase() || ''
                    const location = job.location?.toLowerCase() || ''

                    return titleEn.includes(query) ||
                        titleTa.includes(query) ||
                        descEn.includes(query) ||
                        descTa.includes(query) ||
                        location.includes(query)
                }
                filteredP = filteredP.filter(filterFn)
                filteredO = filteredO.filter(filterFn)
            }

            setPriorityJobs(filteredP)
            setOtherJobs(filteredO)
            setFilteredJobs([...filteredP, ...filteredO])
        }
    }, [searchQuery, rawPriorityJobs, rawOtherJobs, useLocationMatching])

    const fetchCategories = async () => {
        try {
            const response = await fetch(buildApiUrl('/categories'))
            const data = await response.json()
            if (data.success) {
                setCategories(data.categories)
            } else {
                setCategories(getStaticCategories())
            }
        } catch (err) {
            console.error('Failed to fetch categories, using static data:', err)
            setCategories(getStaticCategories())
        }
    }

    const getStaticCategories = () => [
        { id: 'construction', icon: '🏗️', name: { en: 'Construction', ta: 'கட்டுமானம்' }, jobCount: 50 },
        { id: 'painting', icon: '🎨', name: { en: 'Painting', ta: 'வண்ணம் பூசுதல்' }, jobCount: 30 },
        { id: 'plumbing', icon: '🚿', name: { en: 'Plumbing', ta: 'குழாய் பணி' }, jobCount: 25 },
        { id: 'electrical', icon: '⚡', name: { en: 'Electrical', ta: 'மின் பணி' }, jobCount: 40 },
        { id: 'carpentry', icon: '🪚', name: { en: 'Carpentry', ta: 'தச்சு வேலை' }, jobCount: 20 },
        { id: 'cleaning', icon: '🧹', name: { en: 'Cleaning', ta: 'சுத்தம் செய்தல்' }, jobCount: 35 },
        { id: 'gardening', icon: '🌿', name: { en: 'Gardening', ta: 'தோட்டக்கலை' }, jobCount: 15 },
        { id: 'driving', icon: '🚗', name: { en: 'Driving', ta: 'ஓட்டுநர்' }, jobCount: 28 },
        { id: 'cooking', icon: '🍳', name: { en: 'Cooking', ta: 'சமையல்' }, jobCount: 22 },
        { id: 'security', icon: '🛡️', name: { en: 'Security', ta: 'பாதுகாப்பு' }, jobCount: 18 }
    ]

    const fetchJobs = async () => {
        setLoading(true)
        try {
            const response = await fetch(buildApiUrl('/jobs?limit=100'))
            const data = await response.json()
            if (data.success && data.jobs && data.jobs.length > 0) {
                setJobs(data.jobs)
            } else {
                const demoResponse = await import('../data/demoJobs.json')
                const demoJobs = demoResponse.default || demoResponse
                setJobs(demoJobs.slice(0, 100))
            }
        } catch (err) {
            console.error('Failed to fetch jobs, using demo data:', err)
            try {
                const demoResponse = await import('../data/demoJobs.json')
                const demoJobs = demoResponse.default || demoResponse
                setJobs(demoJobs.slice(0, 100))
            } catch (demoErr) {
                setError('Failed to fetch jobs')
            }
        } finally {
            setLoading(false)
        }
    }

    // Helper to load and filter demo jobs
    const loadFilteredDemoJobs = async () => {
        try {
            const demoResponse = await import('../data/demoJobs.json')
            const demoJobs = demoResponse.default || demoResponse

            const locationQuery = selectedLocation?.displayText?.toLowerCase() || ''
            const cityName = selectedLocation?.city?.name?.en?.toLowerCase() || ''
            const districtName = selectedLocation?.district?.name?.en?.toLowerCase() || ''

            const filteredDemo = demoJobs.filter(job => {
                const jobLocation = job.location?.toLowerCase() || ''
                const matchesLocation = (cityName && jobLocation.includes(cityName)) ||
                                       (districtName && jobLocation.includes(districtName)) ||
                                       (cityName && cityName.includes(jobLocation.split(',')[0]?.trim())) ||
                                       (districtName && districtName.includes(jobLocation.split(',')[0]?.trim())) ||
                                       jobLocation.includes(locationQuery)

                if (selectedCategory) {
                    return matchesLocation && job.category === selectedCategory
                }
                return matchesLocation
            })

            setRawPriorityJobs(filteredDemo)
            setRawOtherJobs([])
            setUseLocationMatching(true)
        } catch (err) {
            console.error('Failed to load demo jobs in fallback:', err)
            setRawPriorityJobs([])
            setRawOtherJobs([])
            setUseLocationMatching(true)
        }
    }

    // Location-first matching: Fetch jobs prioritized by user's location
    const fetchLocationMatchedJobs = async () => {
        if (!selectedLocation) return

        setLoading(true)
        setError(null)
        try {
            // Extract district name from the location object
            // GPS location might not have district.name.en if not matched to our database
            const district = selectedLocation.district?.name?.en ||
                selectedLocation.city?.name?.en ||
                selectedLocation.displayText?.split(',')[0]?.trim() || ''

            // GPS uses 'coords', manual selection might use 'coordinates'
            const lat = selectedLocation.coords?.lat || selectedLocation.coordinates?.lat || ''
            const lng = selectedLocation.coords?.lng || selectedLocation.coordinates?.lng || ''
            const category = selectedCategory || ''

            const params = new URLSearchParams()
            if (district) params.append('district', district)
            if (lat) params.append('lat', lat)
            if (lng) params.append('lng', lng)
            if (category) params.append('category', category)

            const response = await fetch(buildApiUrl(`/jobs/location-matched?${params}`))
            const data = await response.json()

            if (data.success) {
                const fetchedPriority = data.priorityJobs || []
                if (fetchedPriority.length > 0) {
                    setRawPriorityJobs(fetchedPriority)
                    setRawOtherJobs([]) // Do not display unrelated locations
                    setUseLocationMatching(true)
                } else {
                    // Fallback to filtered demo jobs
                    await loadFilteredDemoJobs()
                }
            } else {
                // Fallback to filtered demo jobs
                await loadFilteredDemoJobs()
            }
        } catch (err) {
            console.error('Location matching failed, falling back to demo jobs:', err)
            await loadFilteredDemoJobs()
        } finally {
            setLoading(false)
        }
    }

    const applyFilters = () => {
        let result = jobs

        // Filter by category
        if (selectedCategory) {
            result = result.filter(job => job.category === selectedCategory)
        }

        // Filter by location (city or district)
        if (selectedLocation) {
            const locationQuery = selectedLocation.displayText?.toLowerCase() || ''
            const cityName = selectedLocation.city?.name?.en?.toLowerCase() || ''
            const districtName = selectedLocation.district?.name?.en?.toLowerCase() || ''

            result = result.filter(job => {
                const jobLocation = job.location?.toLowerCase() || ''
                return jobLocation.includes(cityName) ||
                    jobLocation.includes(districtName) ||
                    cityName.includes(jobLocation.split(',')[0]?.trim()) ||
                    districtName.includes(jobLocation.split(',')[0]?.trim())
            })
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(job => {
                const titleEn = job.title?.en?.toLowerCase() || ''
                const titleTa = job.title?.ta?.toLowerCase() || ''
                const descEn = job.description?.en?.toLowerCase() || ''
                const descTa = job.description?.ta?.toLowerCase() || ''
                const location = job.location?.toLowerCase() || ''

                return titleEn.includes(query) ||
                    titleTa.includes(query) ||
                    descEn.includes(query) ||
                    descTa.includes(query) ||
                    location.includes(query)
            })
        }

        setFilteredJobs(result)
    }

    const clearFilters = () => {
        setSelectedCategory(null)
        setSelectedLocation(null)
        setSearchQuery('')
        setUseLocationMatching(false)
        setPriorityJobs([])
        setOtherJobs([])
    }

    const reloadJobs = () => fetchJobs()

    const fetchNearbyJobs = async (lat, lng, radius = 10000) => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(buildApiUrl(`/jobs/nearby?lat=${lat}&lng=${lng}&radius=${radius}${selectedCategory ? `&category=${selectedCategory}` : ''}`))
            const data = await response.json()
            if (data.success) {
                setJobs(data.jobs)
                return { success: true, count: data.count }
            } else {
                setError(data.message)
                return { success: false, message: data.message }
            }
        } catch (err) {
            const message = 'Failed to fetch nearby jobs'
            setError(message)
            console.error(message, err)
            return { success: false, message }
        } finally {
            setLoading(false)
        }
    }

    return (
        <JobContext.Provider value={{
            jobs,
            filteredJobs,
            categories,
            selectedCategory,
            selectedLocation,
            searchQuery,
            loading,
            error,
            // Location-first matching
            priorityJobs,
            otherJobs,
            useLocationMatching,
            setSelectedCategory,
            setSelectedLocation,
            setSearchQuery,
            clearFilters,
            reloadJobs,
            fetchNearbyJobs,
            fetchLocationMatchedJobs
        }}>
            {children}
        </JobContext.Provider>
    )
}

export function useJobs() {
    const context = useContext(JobContext)
    if (!context) {
        throw new Error('useJobs must be used within a JobProvider')
    }
    return context
}
