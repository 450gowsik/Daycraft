import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useJobs } from '../context/JobContext.jsx'
import { useSearchParams } from 'react-router-dom'
import JobCard from '../components/jobs/JobCard.jsx'
import BestForYouSection from '../components/jobs/BestForYouSection.jsx'
import LocationModal from '../components/common/LocationModal.jsx'
import { JOB_CATEGORIES } from '../constants/categories.js'
import CategoryIcon from '../components/jobs/CategoryIcon.jsx'
import { FaThLarge, FaSearch } from 'react-icons/fa'
import './Jobs.css'

// Skeleton Loader Component
function JobCardSkeleton() {
    return (
        <div className="job-card-skeleton">
            <div className="skeleton-header">
                <div className="skeleton-badge"></div>
                <div className="skeleton-badge-sm"></div>
            </div>
            <div className="skeleton-title"></div>
            <div className="skeleton-meta">
                <div className="skeleton-line"></div>
                <div className="skeleton-line-short"></div>
            </div>
            <div className="skeleton-footer">
                <div className="skeleton-tag"></div>
                <div className="skeleton-tag"></div>
            </div>
        </div>
    )
}

function Jobs() {
    const { language } = useLanguage()
    const [searchParams] = useSearchParams()
    const {
        filteredJobs,
        loading: isLoading,
        searchQuery,
        setSearchQuery,
        selectedLocation,
        setSelectedLocation,
        selectedCategory,
        setSelectedCategory,
        // Location-first matching
        priorityJobs,
        otherJobs,
        useLocationMatching
    } = useJobs()

    const [showLocationModal, setShowLocationModal] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)

    // Sync URL params with Context on mount
    useEffect(() => {
        const queryParam = searchParams.get('query') || searchParams.get('q')
        const locationParam = searchParams.get('location') || searchParams.get('l')
        const categoryParam = searchParams.get('category') || searchParams.get('c')

        if (queryParam && queryParam !== searchQuery) {
            setSearchQuery(queryParam)
        }

        if (categoryParam && categoryParam !== selectedCategory) {
            // Find category ID by name/ID match if needed, or assume ID
            setSelectedCategory(categoryParam.toLowerCase())
        }

        if (locationParam) {
            // Check if we need to update location to avoid infinite loops or overwrites
            if (!selectedLocation || selectedLocation.displayText !== locationParam) {
                setSelectedLocation({
                    displayText: locationParam,
                    source: 'url_param'
                })
            }
        }
    }, [searchParams])

    // Handle location change with animation
    const handleLocationSelect = (location) => {
        setIsTransitioning(true)
        setTimeout(() => {
            setSelectedLocation(location)
            setTimeout(() => {
                setIsTransitioning(false)
            }, 300)
        }, 200)
    }

    // Clear location filter
    const handleClearLocation = () => {
        setIsTransitioning(true)
        setTimeout(() => {
            setSelectedLocation(null)
            setTimeout(() => {
                setIsTransitioning(false)
            }, 300)
        }, 200)
    }

    // Text translations
    const t = {
        stickyLocation: language === 'ta' ? 'உங்கள் இருப்பிடம்' : 'Your Location',
        change: language === 'ta' ? 'மாற்று' : 'Change',
        allLocations: language === 'ta' ? 'அனைத்து இடங்களும்' : 'All Locations',
        searchPlaceholder: language === 'ta' ? 'வேலைகளை தேடு...' : 'Search jobs...',
        jobsFound: language === 'ta' ? 'வேலைகள் கண்டறியப்பட்டன' : 'jobs found',
        noJobs: language === 'ta' ? 'வேலைகள் இல்லை' : 'No jobs found',
        noJobsDesc: language === 'ta'
            ? 'தேடல் அல்லது இடத்தை மாற்றி முயற்சிக்கவும்'
            : 'Try changing your search or location',
        nearYou: language === 'ta' ? 'உங்கள் அருகில்' : 'Near you',
        allCategories: language === 'ta' ? 'அனைத்து வகைகள்' : 'All Categories',
        // Location-first section titles
        jobsInYourArea: language === 'ta' ? 'உங்கள் பகுதியில் வேலைகள்' : 'Jobs in your area',
        moreJobsNearYou: language === 'ta' ? 'அருகிலுள்ள மேலும் வேலைகள்' : 'More jobs near you',
        bestMatches: language === 'ta' ? 'சிறந்த பொருத்தங்கள்' : 'Best matches'
    }

    // Infinite Ticker Data (Double the list for seamless loop)
    const tickerCategories = [...JOB_CATEGORIES, ...JOB_CATEGORIES]

    // Calculate total jobs count
    const totalJobs = useLocationMatching
        ? priorityJobs.length + otherJobs.length
        : filteredJobs.length

    return (
        <div className="jobs-page-mobile">
            {/* Sticky Location Bar */}
            <div className="sticky-location-bar">
                <div className="location-info">
                    <span className="location-dot"></span>
                    <div className="location-text">
                        <span className="location-label">{t.stickyLocation}</span>
                        <span className="location-value">
                            {selectedLocation ? selectedLocation.displayText : t.allLocations}
                        </span>
                    </div>
                </div>
                <div className="location-actions">
                    {selectedLocation && (
                        <button className="clear-location-btn" onClick={handleClearLocation}>
                            ✕
                        </button>
                    )}
                    <button className="change-location-btn" onClick={() => setShowLocationModal(true)}>
                        {t.change}
                    </button>
                </div>
            </div>

            {/* News Ticker Style Categories */}
            <div className="category-ticker-section">
                <div className="category-ticker-container">
                    <div className="category-ticker-track">
                        <button
                            className={`category-pill ${!selectedCategory ? 'active' : ''}`}
                            onClick={() => setSelectedCategory('')}
                        >
                            <FaThLarge className="category-pill-icon" size={14} style={{ marginRight: '6px' }} />
                            <span>{t.allCategories}</span>
                        </button>
                        {tickerCategories.map((cat, index) => (
                            <button
                                key={`${cat.id}-${index}`}
                                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                            >
                                <CategoryIcon category={cat.id} size={16} className="category-pill-icon" />
                                <span>{language === 'ta' ? cat.ta : cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-filter-bar">
                <div className="search-input-wrapper">
                    <FaSearch className="search-icon" aria-hidden="true" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder={t.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Trust Messaging Bar */}
            <div className="trust-messaging-bar">
                <span className="trust-message">
                    {language === 'ta' ? 'சரிபார்க்கப்பட்ட உள்ளூர் வேலைகள். இடைத்தரகர்கள் இல்லை. வெளிப்படையான ஊதியம்.' : 'Verified local jobs. No middlemen. Pay transparency.'}
                </span>
            </div>

            {/* AI-Powered Best for You Section */}
            <BestForYouSection />

            {/* Jobs Count */}
            <div className="jobs-count-bar">
                <span className="jobs-count">
                    <strong>{totalJobs}</strong> {t.jobsFound}
                </span>
                {selectedLocation && (
                    <span className="location-tag">
                        {selectedLocation.displayText}
                    </span>
                )}
            </div>

            {/* Job Cards Container */}
            <div className={`jobs-container ${isTransitioning ? 'transitioning' : ''}`}>
                {isLoading || isTransitioning ? (
                    // Skeleton Loaders
                    <div className="jobs-grid">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <JobCardSkeleton key={i} />
                        ))}
                    </div>
                ) : useLocationMatching && selectedLocation ? (
                    // Location-First Two-Section UI
                    <>
                        {/* Priority Section - Jobs in your area */}
                        {priorityJobs.length > 0 && (
                            <section className="jobs-section priority-section">
                                <div className="section-header">
                                    <h2 className="section-title">
                                        <span className="section-icon-dot"></span>
                                        {t.jobsInYourArea}
                                    </h2>
                                    <span className="section-subtitle">
                                        {selectedLocation.displayText} • {t.bestMatches}
                                    </span>
                                </div>
                                <div className="jobs-grid priority-grid">
                                    {priorityJobs.map((job, index) => (
                                        <div
                                            key={job._id || job.id}
                                            className="job-card-wrapper priority-card"
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                        >
                                            <JobCard job={job} showMatchScore={true} />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Section Divider */}
                        {priorityJobs.length > 0 && otherJobs.length > 0 && (
                            <div className="section-divider">
                                <span className="divider-line"></span>
                                <span className="divider-text">{t.moreJobsNearYou}</span>
                                <span className="divider-line"></span>
                            </div>
                        )}

                        {/* Other Section - Nearby jobs */}
                        {otherJobs.length > 0 && (
                            <section className="jobs-section other-section">
                                {priorityJobs.length === 0 && (
                                    <div className="section-header">
                                        <h2 className="section-title">
                                            <span className="section-icon-dot"></span>
                                            {t.moreJobsNearYou}
                                        </h2>
                                    </div>
                                )}
                                <div className="jobs-grid">
                                    {otherJobs.map((job, index) => (
                                        <div
                                            key={job._id || job.id}
                                            className="job-card-wrapper"
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                        >
                                            <JobCard job={job} />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Empty state when no jobs at all */}
                        {priorityJobs.length === 0 && otherJobs.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-icon-badge">J</div>
                                <h3>{language === 'ta' ? 'இப்போது அருகில் வேலைகள் இல்லை' : 'No jobs nearby right now'}</h3>
                                <p className="empty-subtext">
                                    {language === 'ta'
                                        ? 'புதிய வேலைகள் வரும்போது நாங்கள் உங்களுக்கு தெரிவிப்போம். கவலை வேண்டாம்!'
                                        : "We'll notify you when new work opens. Check back soon!"}
                                </p>
                                <button className="btn-primary" onClick={handleClearLocation}>
                                    {language === 'ta' ? 'எல்லா இடங்களையும் பார்' : 'View All Locations'}
                                </button>
                            </div>
                        )}
                    </>
                ) : filteredJobs.length > 0 ? (
                    // Standard Job Cards (no location selected)
                    <div className="jobs-grid">
                        {filteredJobs.map((job, index) => (
                            <div
                                key={job._id || job.id}
                                className="job-card-wrapper"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <JobCard job={job} />
                            </div>
                        ))}
                    </div>
                ) : (
                    // Empty State
                    <div className="empty-state">
                        <div className="empty-icon-badge">J</div>
                        <h3>{language === 'ta' ? 'இப்போது அருகில் வேலைகள் இல்லை' : 'No jobs nearby right now'}</h3>
                        <p className="empty-subtext">
                            {language === 'ta'
                                ? 'புதிய வேலைகள் வரும்போது நாங்கள் உங்களுக்கு தெரிவிப்போம். கவலை வேண்டாம்!'
                                : "We'll notify you when new work opens. Check back soon!"}
                        </p>
                        {selectedLocation && (
                            <button className="btn-primary" onClick={handleClearLocation}>
                                {language === 'ta' ? 'எல்லா இடங்களையும் பார்' : 'View All Locations'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Location Modal */}
            <LocationModal
                isOpen={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
            />
        </div>
    )
}

export default Jobs
