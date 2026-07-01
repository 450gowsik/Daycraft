/**
 * locationService.js — IP-based geolocation using ip-api.com
 * 
 * Free for non-commercial use, no API key required.
 * HTTP-only endpoint, limited to 45 requests/minute.
 * Returns approximate location based on public IP — not GPS.
 * 
 * Results are cached in sessionStorage to avoid redundant calls.
 */

import locationData from '../data/tamilNaduLocations.json'

const CACHE_KEY = 'daycraft_ip_location'

/**
 * Fetch approximate location from ip-api.com.
 * Returns cached result if available.
 * 
 * @returns {Promise<{status: string, city: string, regionName: string, country: string, lat: number, lon: number, isp: string} | null>}
 */
export async function getIpLocation() {
    // Check sessionStorage cache first
    try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
            const parsed = JSON.parse(cached)
            // Cache is valid for this session
            if (parsed && parsed.status === 'success') {
                return parsed
            }
        }
    } catch (e) {
        // sessionStorage may be unavailable (private browsing, etc.)
    }

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch('http://ip-api.com/json/', {
            signal: controller.signal
        })
        clearTimeout(timeoutId)

        const data = await response.json()

        if (data && data.status === 'success') {
            // Cache the result
            try {
                sessionStorage.setItem(CACHE_KEY, JSON.stringify(data))
            } catch (e) {
                // Ignore storage errors
            }
            return data
        }

        return null
    } catch (error) {
        console.warn('IP location lookup failed:', error.message)
        return null
    }
}

/**
 * Match a city name from the IP API response to the closest
 * district in the tamilNaduLocations.json dataset.
 * 
 * Checks against district names and city names within each district.
 * 
 * @param {string} cityName - City name from IP API (e.g., "Chennai", "Coimbatore")
 * @returns {{ district: object, city: object|null, districtName: string } | null}
 */
export function matchToDistrict(cityName) {
    if (!cityName) return null

    const query = cityName.toLowerCase()

    for (const district of locationData.districts) {
        // Check district name match
        if (district.name.en.toLowerCase() === query) {
            // Return the first city as default (usually the district HQ)
            return {
                district,
                city: district.cities[0] || null,
                districtName: district.name.en
            }
        }

        // Check if any city within the district matches
        const matchedCity = district.cities.find(city =>
            city.name.en.toLowerCase() === query ||
            city.name.en.toLowerCase().includes(query) ||
            query.includes(city.name.en.toLowerCase())
        )

        if (matchedCity) {
            return {
                district,
                city: matchedCity,
                districtName: district.name.en
            }
        }
    }

    // Fuzzy: check if query is a substring of district name
    for (const district of locationData.districts) {
        if (district.name.en.toLowerCase().includes(query) ||
            query.includes(district.name.en.toLowerCase())) {
            return {
                district,
                city: district.cities[0] || null,
                districtName: district.name.en
            }
        }
    }

    return null
}

/**
 * High-level helper: fetch IP location and match it to a TN district.
 * Returns a ready-to-use location object or null.
 * 
 * @param {string} language - Current language ('en' or 'ta')
 * @returns {Promise<{ displayText: string, district: object, city: object, lat: number, lon: number, source: string } | null>}
 */
export async function detectLocation(language = 'en') {
    const ipData = await getIpLocation()
    if (!ipData) return null

    const match = matchToDistrict(ipData.city)

    if (match) {
        const lang = language === 'ta' ? 'ta' : 'en'
        const cityText = match.city ? match.city.name[lang] : match.district.name[lang]
        const districtText = match.district.name[lang]
        const displayText = match.city
            ? `${cityText}, ${districtText}`
            : districtText

        return {
            displayText,
            district: match.district,
            city: match.city,
            districtName: match.districtName,
            lat: ipData.lat,
            lon: ipData.lon,
            source: 'ip_auto'
        }
    }

    // IP resolved but city not in our TN dataset — still return raw data
    return {
        displayText: ipData.city || ipData.regionName || 'Unknown',
        district: null,
        city: null,
        districtName: null,
        lat: ipData.lat,
        lon: ipData.lon,
        source: 'ip_auto'
    }
}
