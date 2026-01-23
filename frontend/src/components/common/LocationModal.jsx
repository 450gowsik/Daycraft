import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../context/LanguageContext.jsx'
import locationData from '../../data/tamilNaduLocations.json'
import './LocationModal.css'

function LocationModal({ isOpen, onClose, onSelect, selectedLocation }) {
    const { language } = useLanguage()
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedDistrict, setExpandedDistrict] = useState(null)
    const [selectedCity, setSelectedCity] = useState(selectedLocation || null)
    const [useCurrentLocation, setUseCurrentLocation] = useState(false)
    const [loadingLocation, setLoadingLocation] = useState(false)

    // Filter districts based on search
    const filteredDistricts = useMemo(() => {
        if (!searchQuery.trim()) return locationData.districts
        const query = searchQuery.toLowerCase()
        return locationData.districts.filter(district => {
            const nameMatch = district.name.en.toLowerCase().includes(query) ||
                district.name.ta.includes(query)
            const cityMatch = district.cities.some(city =>
                city.name.en.toLowerCase().includes(query) ||
                city.name.ta.includes(query)
            )
            return nameMatch || cityMatch
        })
    }, [searchQuery])

    const handleDistrictClick = (districtId) => {
        setExpandedDistrict(expandedDistrict === districtId ? null : districtId)
    }

    const handleCitySelect = (district, city) => {
        setUseCurrentLocation(false)
        const location = {
            district: district,
            city: city,
            displayText: `${city.name[language]}, ${district.name[language]}`
        }
        setSelectedCity(location)
    }

    const handleConfirm = () => {
        if (selectedCity) {
            onSelect(selectedCity)
            onClose()
        }
    }

    const [locationError, setLocationError] = useState(null)

    // Helper function to match city from coordinates/name
    const matchCityFromData = (cityName, lat = null, lng = null) => {
        for (const district of locationData.districts) {
            const matchedCity = district.cities.find(city =>
                city.name.en.toLowerCase().includes(cityName.toLowerCase()) ||
                cityName.toLowerCase().includes(city.name.en.toLowerCase())
            )
            if (matchedCity) {
                return {
                    district: district,
                    city: matchedCity,
                    coords: lat && lng ? { lat, lng } : undefined,
                    displayText: `${matchedCity.name[language]}, ${district.name[language]}`,
                    isCurrentLocation: true
                }
            }
        }
        return null
    }

    // Multiple FREE IP location services for fallback
    const ipLocationServices = [
        {
            name: 'ipwho.is',
            url: 'https://ipwho.is/',
            parse: (data) => data.success ? {
                city: data.city || data.region,
                lat: data.latitude,
                lng: data.longitude
            } : null
        },
        {
            name: 'ipapi.co',
            url: 'https://ipapi.co/json/',
            parse: (data) => !data.error ? {
                city: data.city || data.region,
                lat: data.latitude,
                lng: data.longitude
            } : null
        },
        {
            name: 'freeipapi.com',
            url: 'https://freeipapi.com/api/json',
            parse: (data) => data.cityName ? {
                city: data.cityName,
                lat: data.latitude,
                lng: data.longitude
            } : null
        }
    ]

    // Fallback: Get location from IP address (tries multiple services)
    const getLocationFromIP = async () => {
        for (const service of ipLocationServices) {
            try {
                console.log(`Trying ${service.name}...`)
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 5000)

                const response = await fetch(service.url, { signal: controller.signal })
                clearTimeout(timeoutId)
                const data = await response.json()
                const parsed = service.parse(data)

                if (parsed && parsed.city) {
                    console.log(`${service.name} returned:`, parsed.city)

                    // Try to find matching city in our location data
                    const matchedLocation = matchCityFromData(parsed.city, parsed.lat, parsed.lng)

                    if (matchedLocation) {
                        setSelectedCity(matchedLocation)
                        setUseCurrentLocation(true)
                        setLocationError(null)
                        return true
                    } else {
                        // Use coords even if city not found in our list
                        const location = {
                            district: null,
                            city: null,
                            coords: { lat: parsed.lat, lng: parsed.lng },
                            displayText: parsed.city,
                            locationType: 'network',
                            isCurrentLocation: true
                        }
                        setSelectedCity(location)
                        setUseCurrentLocation(true)
                        setLocationError(null)
                        return true
                    }
                }
            } catch (error) {
                console.log(`${service.name} failed:`, error.message)
                // Continue to next service
            }
        }
        console.log('All IP location services failed')
        return false
    }

    // Reverse geocode coordinates to get city/area name
    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
                { headers: { 'Accept-Language': 'en' } }
            )
            const data = await response.json()

            if (data && data.address) {
                const { city, town, village, county, state_district, state } = data.address
                const cityName = city || town || village || county || state_district || 'Unknown'
                const districtName = state_district || county || state || ''

                // Try to find matching location in our data
                for (const district of locationData.districts) {
                    const matchedCity = district.cities.find(c =>
                        c.name.en.toLowerCase().includes(cityName.toLowerCase()) ||
                        cityName.toLowerCase().includes(c.name.en.toLowerCase())
                    )
                    if (matchedCity) {
                        return {
                            district: district,
                            city: matchedCity,
                            coords: { lat, lng },
                            displayText: `${matchedCity.name[language]}, ${district.name[language]}`,
                            locationType: 'gps',
                            isCurrentLocation: true
                        }
                    }
                }

                // Return with detected name even if not in our list
                return {
                    district: null,
                    city: null,
                    coords: { lat, lng },
                    displayText: `${cityName}${districtName ? ', ' + districtName : ''}`,
                    locationType: 'gps',
                    isCurrentLocation: true
                }
            }
            return null
        } catch (error) {
            console.error('Reverse geocoding error:', error)
            return null
        }
    }

    const handleCurrentLocation = async () => {
        setLoadingLocation(true)
        setLocationError(null)

        // Check if geolocation is supported
        if (!navigator.geolocation) {
            console.log('Geolocation not supported, trying IP-based location...')
            const ipSuccess = await getLocationFromIP()
            if (!ipSuccess) {
                setLocationError(language === 'ta'
                    ? 'இருப்பிடம் கண்டறிய முடியவில்லை'
                    : 'Could not detect location automatically')
            }
            setLoadingLocation(false)
            return
        }

        // Request GPS permission and get location
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    {
                        timeout: 15000, // 15 seconds timeout
                        enableHighAccuracy: true, // Request best accuracy
                        maximumAge: 60000 // Accept cached position up to 1 minute old
                    }
                )
            })

            console.log('GPS Success:', position.coords.latitude, position.coords.longitude)

            // Reverse geocode to get location name
            const geoResult = await reverseGeocode(position.coords.latitude, position.coords.longitude)

            if (geoResult) {
                setSelectedCity(geoResult)
                setUseCurrentLocation(true)
                setLoadingLocation(false)
            } else {
                // Fallback: just use coordinates with generic text
                const location = {
                    district: null,
                    city: null,
                    coords: { lat: position.coords.latitude, lng: position.coords.longitude },
                    displayText: language === 'ta' ? 'தற்போதைய இருப்பிடம்' : 'Current Location',
                    locationType: 'gps',
                    isCurrentLocation: true
                }
                setSelectedCity(location)
                setUseCurrentLocation(true)
                setLoadingLocation(false)
            }
        } catch (error) {
            console.log('GPS failed:', error.message, '- trying IP-based location...')

            // Show specific error message based on error code
            let errorMessage = ''
            switch (error.code) {
                case 1: // PERMISSION_DENIED
                    errorMessage = language === 'ta'
                        ? 'GPS அனுமதி மறுக்கப்பட்டது. உலாவி அமைப்புகளில் இருப்பிட அனுமதியை இயக்கவும்.'
                        : 'GPS permission denied. Please enable location access in browser settings.'
                    break
                case 2: // POSITION_UNAVAILABLE
                    errorMessage = language === 'ta'
                        ? 'GPS சிக்னல் கிடைக்கவில்லை.'
                        : 'GPS signal not available.'
                    break
                case 3: // TIMEOUT
                    errorMessage = language === 'ta'
                        ? 'GPS நேரம் முடிந்தது.'
                        : 'GPS request timed out.'
                    break
                default:
                    errorMessage = language === 'ta'
                        ? 'GPS பிழை.'
                        : 'GPS error occurred.'
            }

            console.log(errorMessage)

            // Try IP-based fallback
            const ipSuccess = await getLocationFromIP()
            if (!ipSuccess) {
                setLocationError(language === 'ta'
                    ? 'இருப்பிடம் கண்டறிய முடியவில்லை. கீழே நகரத்தைத் தேர்ந்தெடுக்கவும்.'
                    : 'Could not detect location. Please select a city below.')
            }
            setLoadingLocation(false)
        }
    }

    if (!isOpen) return null

    // Use Portal to render modal at document body level
    return createPortal(
        <div className="location-modal-overlay" onClick={onClose}>
            <div className="location-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h3>
                        <span className="header-icon">📍</span>
                        {language === 'ta' ? 'இருப்பிடம் தேர்வு' : 'Select Location'}
                    </h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {/* Current Location Option */}
                <div className="current-location-section">
                    <button
                        className={`current-location-btn ${useCurrentLocation ? 'active' : ''}`}
                        onClick={handleCurrentLocation}
                        disabled={loadingLocation}
                    >
                        <span className="gps-icon">
                            {loadingLocation ? '⏳' : '📍'}
                        </span>
                        <span className="location-btn-content">
                            <span className="location-btn-title">
                                {language === 'ta' ? 'தற்போதைய இருப்பிடம்' : 'Use Current Location'}
                            </span>
                            <span className="location-btn-subtitle">
                                {language === 'ta' ? 'GPS பயன்படுத்தி கண்டறியவும்' : 'Detect using GPS'}
                            </span>
                        </span>
                        {useCurrentLocation && <span className="check-icon">✓</span>}
                    </button>

                    {/* Location Error Message */}
                    {locationError && (
                        <div className="location-error">
                            ⚠️ {locationError}. {language === 'ta' ? 'கீழே நகரத்தைத் தேர்ந்தெடுக்கவும்.' : 'Please select a city below.'}
                        </div>
                    )}
                </div>

                <div className="divider">
                    <span>{language === 'ta' ? 'அல்லது தேர்வு செய்க' : 'Or choose manually'}</span>
                </div>

                {/* Search */}
                <div className="search-section">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="search-input"
                            placeholder={language === 'ta' ? 'மாவட்டம் அல்லது நகரம் தேடு...' : 'Search district or city...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="clear-search" onClick={() => setSearchQuery('')}>✕</button>
                        )}
                    </div>
                </div>

                {/* District List */}
                <div className="districts-list">
                    {filteredDistricts.length === 0 ? (
                        <div className="no-results">
                            <div className="empty-icon">🔍</div>
                            <p>{language === 'ta' ? 'முடிவுகள் இல்லை' : 'No results found'}</p>
                        </div>
                    ) : (
                        filteredDistricts.map(district => (
                            <div key={district.id} className="district-item">
                                <button
                                    className={`district-header ${expandedDistrict === district.id ? 'expanded' : ''}`}
                                    onClick={() => handleDistrictClick(district.id)}
                                >
                                    <span className="district-icon">🏛️</span>
                                    <span className="district-name">
                                        {language === 'ta' ? district.name.ta : district.name.en}
                                    </span>
                                    <span className="city-count">
                                        {district.cities.length} {language === 'ta' ? 'நகரங்கள்' : 'cities'}
                                    </span>
                                    <span className={`expand-icon ${expandedDistrict === district.id ? 'rotated' : ''}`}>
                                        ▶
                                    </span>
                                </button>

                                {expandedDistrict === district.id && (
                                    <div className="cities-grid">
                                        {district.cities.map(city => (
                                            <button
                                                key={city.id}
                                                className={`city-chip ${selectedCity?.city?.id === city.id ? 'selected' : ''}`}
                                                onClick={() => handleCitySelect(district, city)}
                                            >
                                                {language === 'ta' ? city.name.ta : city.name.en}
                                                {selectedCity?.city?.id === city.id && <span className="check">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Selected Location Display */}
                {selectedCity && (
                    <div className="selected-location">
                        <span className="selected-icon">✓</span>
                        <div className="selected-content">
                            <span className="selected-text">{selectedCity.displayText}</span>
                            {selectedCity.locationType && (
                                <span className="location-type-badge">
                                    {selectedCity.locationType === 'gps'
                                        ? (language === 'ta' ? '📍 GPS மூலம்' : '📍 via GPS')
                                        : (language === 'ta' ? '📡 நெட்வொர்க் மூலம்' : '📡 via Network')
                                    }
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        {language === 'ta' ? 'ரத்து' : 'Cancel'}
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleConfirm}
                        disabled={!selectedCity}
                    >
                        {language === 'ta' ? 'உறுதிப்படுத்து' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

export default LocationModal
