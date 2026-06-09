/**
 * CompleteProfile - World-Class Onboarding
 * Google/Meta/Airbnb inspired step-based profile completion
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import MapPicker from '../../components/common/MapPicker.jsx'
import SuccessModal from '../../components/common/SuccessModal.jsx'
import './CompleteProfile.css'

const DISTRICTS = [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
    'Tirunelveli', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi',
    'Dindigul', 'Thanjavur', 'Ranipet', 'Virudhunagar', 'Karur',
    'Nilgiris', 'Krishnagiri', 'Kanyakumari', 'Cuddalore', 'Kancheepuram'
]

function CompleteProfile() {
    const { language } = useLanguage()
    const { user, updateProfile } = useAuth()
    const navigate = useNavigate()

    // State
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showSuccess, setShowSuccess] = useState(false)
    const [showMap, setShowMap] = useState(false)

    // Location state
    const [locationGranted, setLocationGranted] = useState(false)
    const [location, setLocation] = useState(null)
    const [manualLocation, setManualLocation] = useState('')
    const [locationLoading, setLocationLoading] = useState(false)

    // Profile data - removed unused states
    const totalSteps = 1  // Only location step for now

    // Redirect if profile already completed
    useEffect(() => {
        if (user?.profileCompleted) {
            navigate('/')
        }
    }, [user, navigate])

    // Sync local state with user if user data loads
    useEffect(() => {
        if (user) {
            if (user.location && !manualLocation) {
                setManualLocation(user.location)
                setLocationGranted(true)
            }
            if (user.geoLocation && !location) {
                setLocation(user.geoLocation)
            }
        }
    }, [user, manualLocation, location])

    // Get geolocation
    const handleUseCurrentLocation = async () => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported')
            return
        }

        setLocationLoading(true)
        setError('')

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                }
                setLocation({
                    type: 'Point',
                    coordinates: [coords.lng, coords.lat]
                })

                // Try reverse geocoding
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`
                    )
                    const data = await response.json()
                    const city = data.address?.city || data.address?.town || data.address?.village || 'Current Location'
                    setManualLocation(city)
                } catch {
                    setManualLocation('Current Location')
                }

                setLocationGranted(true)
                setLocationLoading(false)
            },
            (err) => {
                setError('Could not access location. Please try manual entry.')
                setLocationLoading(false)
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    // Handle map selection
    const handleMapSelect = (latlng) => {
        setLocation({
            type: 'Point',
            coordinates: [latlng.lng, latlng.lat]
        })
        setManualLocation('📍 Pinned Location')
        setLocationGranted(true)
        setShowMap(false)
    }

    // Complete profile
    const handleComplete = async () => {
        setLoading(true)
        setError('')

        try {
            const profileData = {
                profileCompleted: true,
                locationVerified: locationGranted
            }

            if (location) {
                profileData.geoLocation = location
            }
            if (manualLocation) {
                profileData.location = manualLocation
            }

            const result = await updateProfile(profileData)

            if (result.success) {
                setShowSuccess(true)
                setTimeout(() => {
                    navigate('/')
                }, 2500)
            } else {
                setError(result.message || 'Failed to update profile')
            }
        } catch (err) {
            setError('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    // Calculate progress percentage
    const getProgress = () => {
        const currentStep = step + 1
        const total = totalSteps + 1
        return (currentStep / total) * 100
    }

    return (
        <div className="onboarding-page">
            {/* Background */}
            <div className="onboarding-bg">
                <div className="bg-gradient"></div>
            </div>

            {/* Main Card */}
            <div className="onboarding-card">
                {/* Progress Bar */}
                <div className="progress-bar-container">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${getProgress()}%` }}
                    />
                </div>

                <div className="step-indicator-row">
                    <div className="step-item">
                        <div className="step-circle active">1</div>
                    </div>
                </div>
                <p className="step-label">Location Selection</p>

                {/* Error */}
                {error && (
                    <div className="onboarding-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* ======================= */}
                {/* STEP 0: ROLE SELECTION  */}
                {/* ======================= */}
                {/* REMOVED - Role selection moved to profile page */}

                {/* ========================= */}
                {/* STEP 0: LOCATION SELECTION */}
                {/* ========================= */}
                {step === 0 && (
                    <div className="onboarding-step fade-in">
                        <div className="icon-container neumorphic">
                            <svg viewBox="0 0 24 24" width="48" height="48" className="location-icon">
                                <path fill="#16A34A" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                        </div>

                        <h1 className="step-title">Your Location</h1>
                        <p className="step-subtitle">
                            {language === 'ta'
                                ? 'வேலைகளைக் கண்டறிய உங்கள் இருப்பிடத்தைப் பயன்படுத்துகிறோம்'
                                : 'We use your location to find jobs near you'}
                        </p>

                        {!locationGranted ? (
                            <div className="location-options">
                                <button
                                    className="btn-primary with-icon"
                                    onClick={handleUseCurrentLocation}
                                    disabled={locationLoading}
                                >
                                    {locationLoading ? (
                                        <span className="btn-loader"></span>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" width="20" height="20">
                                                <path fill="currentColor" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                                            </svg>
                                            Use Current Location
                                        </>
                                    )}
                                </button>

                                <button
                                    className="btn-secondary with-icon"
                                    onClick={() => setShowMap(true)}
                                >
                                    <svg viewBox="0 0 24 24" width="20" height="20">
                                        <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                    </svg>
                                    Pin on Map
                                </button>

                                <div className="manual-input-group">
                                    <svg viewBox="0 0 24 24" width="18" height="18" className="input-icon">
                                        <path fill="#94A3B8" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                    </svg>
                                    <input
                                        type="text"
                                        className="manual-input"
                                        placeholder="Enter city manually (e.g., Chennai)"
                                        value={manualLocation}
                                        onChange={(e) => setManualLocation(e.target.value)}
                                        list="cities"
                                    />
                                    <datalist id="cities">
                                        {DISTRICTS.map(city => (
                                            <option key={city} value={city} />
                                        ))}
                                    </datalist>
                                </div>

                                {manualLocation && (
                                    <button
                                        className="btn-primary"
                                        onClick={() => {
                                            setLocationGranted(true)
                                        }}
                                    >
                                        Continue with {manualLocation}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="location-success">
                                <div className="success-badge">
                                    <svg viewBox="0 0 24 24" width="20" height="20">
                                        <path fill="#16A34A" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                    </svg>
                                    <span>{manualLocation || 'Location Detected'}</span>
                                </div>
                                <button
                                    className="btn-primary"
                                    onClick={handleComplete}
                                    disabled={loading}
                                >
                                    {loading ? <span className="btn-loader"></span> : 'Complete Profile'}
                                </button>
                                <button
                                    className="btn-ghost"
                                    onClick={() => {
                                        setLocationGranted(false)
                                        setManualLocation('')
                                        setLocation(null)
                                    }}
                                >
                                    Change Location
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Map Modal */}
                {showMap && (
                    <div className="map-modal-overlay" onClick={() => setShowMap(false)}>
                        <div className="map-modal" onClick={e => e.stopPropagation()}>
                            <div className="map-modal-header">
                                <h3>Select Location</h3>
                                <button onClick={() => setShowMap(false)}>✕</button>
                            </div>
                            <div className="map-container">
                                <MapPicker onLocationSelect={handleMapSelect} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Success Modal */}
            <SuccessModal
                isOpen={showSuccess}
                title="Profile Completed!"
                subtitle="Taking you to home..."
            />
        </div>
    )
}

export default CompleteProfile
