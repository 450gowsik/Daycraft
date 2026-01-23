import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import LocationModal from './LocationModal.jsx'
import './LocationPicker.css'

function LocationPicker({ value, onChange, placeholder, className = '' }) {
    const { language } = useLanguage()
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleSelect = (location) => {
        onChange(location)
    }

    const handleClear = (e) => {
        e.stopPropagation()
        onChange(null)
    }

    return (
        <>
            <button
                type="button"
                className={`location-picker ${value ? 'has-value' : ''} ${className}`}
                onClick={() => setIsModalOpen(true)}
            >
                <span className="picker-icon">📍</span>
                <span className="picker-text">
                    {value ? value.displayText : (placeholder || (language === 'ta' ? 'இருப்பிடம் தேர்வு செய்க' : 'Select Location'))}
                </span>
                {value ? (
                    <button className="picker-clear" onClick={handleClear}>✕</button>
                ) : (
                    <span className="picker-arrow">▼</span>
                )}
            </button>

            <LocationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleSelect}
                selectedLocation={value}
            />
        </>
    )
}

export default LocationPicker
