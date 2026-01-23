/**
 * Distance/Geo Utilities
 * Calculate distances between geographic coordinates
 */

/**
 * Calculate distance between two geo points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @param {string} unit - 'km' or 'miles' (default: 'km')
 * @returns {number} Distance in specified unit
 */
const calculateDistance = (lat1, lon1, lat2, lon2, unit = 'km') => {
    const R = unit === 'miles' ? 3959 : 6371 // Earth's radius

    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
}

/**
 * Convert degrees to radians
 * @param {number} deg - Degrees
 * @returns {number} Radians
 */
const toRad = (deg) => {
    return deg * (Math.PI / 180)
}

/**
 * Check if a point is within a given radius
 * @param {Object} center - { lat, lng } center point
 * @param {Object} point - { lat, lng } point to check
 * @param {number} radiusKm - Radius in kilometers
 * @returns {boolean} True if point is within radius
 */
const isWithinRadius = (center, point, radiusKm) => {
    const distance = calculateDistance(
        center.lat, center.lng,
        point.lat, point.lng
    )
    return distance <= radiusKm
}

/**
 * Convert GeoJSON coordinates to lat/lng object
 * GeoJSON format: [longitude, latitude]
 * @param {Array} coordinates - GeoJSON coordinates array
 * @returns {Object} { lat, lng }
 */
const geoJSONToLatLng = (coordinates) => {
    if (!coordinates || coordinates.length < 2) return null
    return {
        lng: coordinates[0],
        lat: coordinates[1]
    }
}

/**
 * Convert lat/lng to GeoJSON format
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} GeoJSON Point object
 */
const latLngToGeoJSON = (lat, lng) => {
    return {
        type: 'Point',
        coordinates: [lng, lat]
    }
}

module.exports = {
    calculateDistance,
    isWithinRadius,
    geoJSONToLatLng,
    latLngToGeoJSON,
    toRad
}
