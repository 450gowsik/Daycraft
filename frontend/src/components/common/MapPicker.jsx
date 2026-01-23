import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition }) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng)
            map.flyTo(e.latlng, map.getZoom())
        },
    })

    return position === null ? null : (
        <Marker position={position}></Marker>
    )
}

export default function MapPicker({ onLocationSelect, initialPosition }) {
    // Default to Center of Tamil Nadu if no initial position
    const defaultCenter = initialPosition || { lat: 11.1271, lng: 78.6569 }
    const [position, setPosition] = useState(initialPosition || null)

    useEffect(() => {
        if (position) {
            onLocationSelect(position)
        }
    }, [position, onLocationSelect])

    return (
        <div className="map-picker-container" style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e0e0e0' }}>
            <MapContainer
                center={defaultCenter}
                zoom={7}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
            <div style={{ padding: '8px', background: '#f5f5f5', fontSize: '12px', textAlign: 'center', color: '#666' }}>
                Tap on the map to set your location
            </div>
        </div>
    )
}
