import { createContext, useContext, useState, useEffect } from 'react'
import en from '../translations/en.json'
import ta from '../translations/ta.json'

const translations = { en, ta }

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('daycraft-language')
        return saved || 'en'
    })

    useEffect(() => {
        localStorage.setItem('daycraft-language', language)
        document.documentElement.lang = language
    }, [language])

    const t = (key) => {
        const keys = key.split('.')
        let value = translations[language]

        for (const k of keys) {
            value = value?.[k]
        }

        return value || key
    }

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'ta' : 'en')
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}
