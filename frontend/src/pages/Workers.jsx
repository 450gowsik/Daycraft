import { useState, lazy, Suspense } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useWorkers } from '../context/WorkerContext.jsx'
import { useToast } from '../components/common/Toast.jsx'
import WorkerCard from '../components/workers/WorkerCard.jsx'
import './Workers.css'

// Lazy load modal for performance
const WorkerDetailsModal = lazy(() => import('../components/workers/WorkerDetailsModal.jsx'))

// Tamil Nadu Districts
const districts = [
    'All Districts',
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
    'Tirunelveli', 'Tirupur', 'Vellore', 'Erode', 'Theni',
    'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivaganga',
    'Kanyakumari', 'Karur', 'Virudhunagar', 'Nagapattinam', 'Namakkal'
]

function Workers() {
    const { t, language } = useLanguage()
    const { filteredWorkers, searchQuery, setSearchQuery, loading } = useWorkers()
    const [selectedDistrict, setSelectedDistrict] = useState('All Districts')
    const toast = useToast()

    // Centralized modal state
    const [selectedWorker, setSelectedWorker] = useState(null)

    const openModal = (worker) => setSelectedWorker(worker)
    const closeModal = () => setSelectedWorker(null)

    const handleRequest = (worker) => {
        // TODO: Connect to proper request API
        console.log('Request sent for worker:', worker._id)

        // Show celebration toast! 🎉
        toast.celebrate(
            language === 'ta' ? 'கோரிக்கை அனுப்பப்பட்டது! 🎉' : 'Request Sent Successfully! 🎉',
            {
                submessage: language === 'ta'
                    ? `${worker.name} விரைவில் உங்களை தொடர்பு கொள்வார்.`
                    : `${worker.name} will contact you soon.`
            }
        )

        closeModal()
    }

    // Filter workers by selected district
    const displayedWorkers = selectedDistrict === 'All Districts'
        ? filteredWorkers
        : filteredWorkers.filter(w =>
            w.location?.includes(selectedDistrict) || w.district === selectedDistrict
        )

    return (
        <div className="workers-page">
            <div className="container">
                <header className="page-header">
                    <h1 className="h1">{t('workers.title')}</h1>
                    <p className="text-lg text-secondary">{t('workers.subtitle')}</p>
                </header>

                {/* Trust Messaging - Story format */}
                <div className="workers-trust-banner">
                    <span className="trust-text">
                        👷 <strong>{displayedWorkers.length}</strong> {language === 'ta' ? 'சரிபார்க்கப்பட்ட தொழிலாளர்கள் இன்று' : 'verified employees available'}
                        {selectedDistrict === 'All Districts'
                            ? (language === 'ta' ? ' 20 மாவட்டங்களில்' : ' across 20 districts today')
                            : ` ${language === 'ta' ? 'இல்' : 'in'} ${selectedDistrict}`}
                    </span>
                </div>

                {/* Trust Badges Row */}
                <div className="trust-badges-row">
                    <span className="trust-badge">✅ {language === 'ta' ? 'ஐடி சரிபார்க்கப்பட்டது' : 'ID Verified'}</span>
                    <span className="trust-badge">🔒 {language === 'ta' ? 'பாதுகாப்பான தொடர்பு' : 'Safe Contact'}</span>
                    <span className="trust-badge">⭐ {language === 'ta' ? 'மதிப்பீடு செய்யப்பட்டது' : 'Rated Employees'}</span>
                </div>


                {/* Filters */}
                <div className="workers-filters">
                    <div className="filters-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                className="input w-full"
                                style={{ paddingLeft: '2.5rem' }}
                                placeholder={t('workers.search')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            style={{
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '2px solid #e8e8e8',
                                fontSize: '15px',
                                fontWeight: '600',
                                color: '#333',
                                background: 'white',
                                cursor: 'pointer',
                                minWidth: '180px'
                            }}
                        >
                            {districts.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-16">
                        <div className="loader"></div>
                        <p className="mt-4 text-secondary">{language === 'ta' ? 'ஏற்றப்படுகிறது...' : 'Loading employees...'}</p>
                    </div>
                ) : displayedWorkers.length > 0 ? (
                    <div className="workers-grid">
                        {displayedWorkers.map(worker => (
                            <WorkerCard
                                key={worker._id}
                                worker={worker}
                                onHire={() => openModal(worker)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="no-results">
                        <h3 className="h3 mb-4">{t('workers.noWorkers')}</h3>
                        <p className="text-secondary">
                            {language === 'ta'
                                ? 'உங்கள் தேடலுக்கு ஏற்ற தொழிலாளர்கள் யாரும் இல்லை.'
                                : 'Try searching for something else or select a different district.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Modal - Lazy loaded, rendered only when worker selected */}
            {selectedWorker && (
                <Suspense fallback={null}>
                    <WorkerDetailsModal
                        worker={selectedWorker}
                        isOpen={!!selectedWorker}
                        onClose={closeModal}
                        onRequest={handleRequest}
                    />
                </Suspense>
            )}
        </div>
    )
}

export default Workers

