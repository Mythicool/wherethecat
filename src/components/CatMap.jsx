import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle } from 'react-leaflet'
import { Search, MapPin, Loader, Plus, Minus } from 'lucide-react'
import L from 'leaflet'
import LocationSearch from './LocationSearch'
import MobileMapWrapper from './MobileMapWrapper'
import { geolocationService, GeolocationError } from '../services/geolocationService'
import 'leaflet/dist/leaflet.css'
import './CatMap.css'

// Tile server configurations with fallbacks
const TILE_SERVERS = [
  {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: ['a', 'b', 'c']
  },
  {
    name: 'OpenStreetMap DE',
    url: 'https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: ['a', 'b', 'c']
  },
  {
    name: 'CartoDB Positron',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: ['a', 'b', 'c', 'd']
  }
]

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom cat icon for authenticated reports
const catIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff6b6b" width="32" height="32">
      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13 3V7H11V3L9 1L3 7V9H5V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V9H21ZM17 20H7V9H17V20ZM8 11V13H10V11H8ZM14 11V13H16V11H14ZM8 15H16V17H8V15Z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

// Custom cat icon for anonymous reports (semi-transparent with different color)
const anonymousCatIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ff6b6b" fill-opacity="0.6" stroke="#ff6b6b" stroke-width="1" width="32" height="32">
      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13 3V7H11V3L9 1L3 7V9H5V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V9H21ZM17 20H7V9H17V20ZM8 11V13H10V11H8ZM14 11V13H16V11H14ZM8 15H16V17H8V15Z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

// User location icon (for current position)
const userLocationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4299e1" width="24" height="24">
      <circle cx="12" cy="12" r="8" fill="#4299e1" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
})

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      })
    }
  })
  return null
}

// Fallback tile layer component with automatic server switching
function FallbackTileLayer({ isMobile }) {
  const [currentServerIndex, setCurrentServerIndex] = useState(0)
  const [tileLoadErrors, setTileLoadErrors] = useState(0)

  const currentServer = TILE_SERVERS[currentServerIndex]

  // Switch to next server if too many tile errors
  useEffect(() => {
    if (tileLoadErrors > 5 && currentServerIndex < TILE_SERVERS.length - 1) {
      console.log(`Switching to fallback tile server: ${TILE_SERVERS[currentServerIndex + 1].name}`)
      setCurrentServerIndex(prev => prev + 1)
      setTileLoadErrors(0)
    }
  }, [tileLoadErrors, currentServerIndex])

  return (
    <TileLayer
      key={`${currentServer.name}-${currentServerIndex}`} // Force re-render on server change
      attribution={currentServer.attribution}
      url={currentServer.url}
      // Mobile-optimized tile loading
      maxZoom={18}
      minZoom={3}
      tileSize={256}
      zoomOffset={0}
      // Improve loading on mobile
      updateWhenIdle={isMobile}
      updateWhenZooming={!isMobile}
      keepBuffer={isMobile ? 1 : 2}
      // Better error handling and retry logic
      errorTileUrl="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMnB4IiBmaWxsPSIjNzE4MDk2Ij5NYXAgdGlsZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg=="
      // Subdomains for load balancing
      subdomains={currentServer.subdomains}
      // Crossorigin for better compatibility
      crossOrigin={true}
      // Event handlers for error tracking
      eventHandlers={{
        tileerror: (e) => {
          console.log('Tile load error:', e)
          setTileLoadErrors(prev => prev + 1)
        },
        tileload: () => {
          // Reset error count on successful loads
          if (tileLoadErrors > 0) {
            setTileLoadErrors(prev => Math.max(0, prev - 1))
          }
        }
      }}
    />
  )
}

function CatMap({ cats, onMapClick }) {
  const mapRef = useRef()
  const [mapLoaded, setMapLoaded] = useState(false)
  const [showLocationSearch, setShowLocationSearch] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState('')
  const [mapDimensions, setMapDimensions] = useState({ width: '100%', height: '100%' })

  // Default center (you can change this to your preferred location)
  const defaultCenter = [35.4676, -97.5164] // Oklahoma City
  const defaultZoom = 13

  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  // Handle map container resize for mobile
  useEffect(() => {
    const updateMapDimensions = () => {
      const container = document.querySelector('.cat-map')
      if (container) {
        const rect = container.getBoundingClientRect()
        setMapDimensions({
          width: rect.width || '100%',
          height: Math.max(rect.height, 300) || '100%'
        })
      }
    }

    // Initial dimension calculation
    updateMapDimensions()

    // Update on resize
    window.addEventListener('resize', updateMapDimensions)
    window.addEventListener('orientationchange', () => {
      setTimeout(updateMapDimensions, 100) // Delay for orientation change
    })

    return () => {
      window.removeEventListener('resize', updateMapDimensions)
      window.removeEventListener('orientationchange', updateMapDimensions)
    }
  }, [])

  // Force map resize when dimensions change
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      setTimeout(() => {
        mapRef.current.invalidateSize()
      }, 100)
    }
  }, [mapDimensions, mapLoaded])

  const handleLocationSelect = (location) => {
    if (mapRef.current) {
      mapRef.current.setView([location.lat, location.lng], 15)
    }
  }

  const handleUseMyLocation = async () => {
    if (!geolocationService.isSupported()) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)
    setLocationError('')

    try {
      console.log('Starting geolocation request...')
      console.log('User agent:', navigator.userAgent)
      console.log('Is mobile:', geolocationService.isMobile())
      console.log('Is iOS Safari:', geolocationService.isIOSSafari())

      // Check permission first if available
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' })
          console.log('Permission state:', permission.state)
          if (permission.state === 'denied') {
            setLocationError('Location access was denied. Please enable location permissions in your browser settings and try again.')
            return
          }
        } catch (permError) {
          // Permissions API not available, continue with location request
          console.log('Permissions API not available, proceeding with location request')
        }
      }

      // Use mobile-optimized method for mobile devices
      const position = geolocationService.isMobile()
        ? await geolocationService.getMobilePosition()
        : await geolocationService.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
          })

      console.log('Position obtained:', position)
      setUserLocation(position)

      // Center map on user's location
      if (mapRef.current) {
        mapRef.current.setView([position.lat, position.lng], 16)
      }

      // Trigger map click at user's location to open cat form
      onMapClick({
        lat: position.lat,
        lng: position.lng,
        fromGeolocation: true,
        accuracy: position.accuracy
      })

      // Clear any previous errors
      setTimeout(() => setLocationError(''), 3000)
    } catch (error) {
      console.error('Geolocation failed:', error)
      const errorMessage = geolocationService.getErrorMessage(error.message)
      setLocationError(errorMessage)
    } finally {
      setGettingLocation(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="cat-map">
      <MobileMapWrapper
        onMapReady={(dimensions) => {
          console.log('Mobile map wrapper ready with dimensions:', dimensions)
        }}
      >
        <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{
          height: mapDimensions.height,
          width: mapDimensions.width,
          minHeight: '300px'
        }}
        ref={mapRef}
        whenReady={() => {
          setMapLoaded(true)
          // Force resize after map is ready (important for mobile)
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.invalidateSize()
            }
          }, 100)
        }}
        // Mobile-optimized options
        zoomControl={!isMobile} // Hide zoom control on mobile to save space
        attributionControl={true}
        // Touch and mobile-specific options
        touchZoom={true}
        doubleClickZoom={true}
        scrollWheelZoom={!isMobile} // Disable scroll zoom on mobile to prevent conflicts
        boxZoom={false}
        keyboard={false}
        dragging={true}
        // Performance options for mobile
        preferCanvas={isMobile}
        // Ensure proper rendering
        renderer={isMobile ? L.canvas() : L.svg()}
      >
        <FallbackTileLayer isMobile={isMobile} />
        
        <MapClickHandler onMapClick={onMapClick} />

        {/* User location marker and accuracy circle */}
        {userLocation && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userLocationIcon}
            >
              <Popup>
                <div className="user-location-popup">
                  <h4>Your Location</h4>
                  <p>Accuracy: ~{Math.round(userLocation.accuracy)}m</p>
                  <p>Confidence: {geolocationService.getAccuracyDescription(userLocation.accuracy)}</p>
                </div>
              </Popup>
            </Marker>
            {userLocation.accuracy && (
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={userLocation.accuracy}
                pathOptions={{
                  color: '#4299e1',
                  fillColor: '#4299e1',
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: '5, 5'
                }}
              />
            )}
          </>
        )}

        {cats.map((cat) => {
          const isAnonymous = cat.reporter_type === 'anonymous'
          return (
            <Marker
              key={cat.id}
              position={[cat.latitude, cat.longitude]}
              icon={isAnonymous ? anonymousCatIcon : catIcon}
            >
            <Popup>
              <div className="cat-popup">
                {cat.photo_urls && cat.photo_urls.length > 0 && (
                  <div className="cat-photos">
                    <img
                      src={cat.photo_urls[0]}
                      alt={cat.name || 'Cat photo'}
                      className="cat-popup-photo"
                    />
                    {cat.photo_urls.length > 1 && (
                      <div className="photo-count">
                        +{cat.photo_urls.length - 1} more
                      </div>
                    )}
                  </div>
                )}

                <h3 className="cat-popup-title">
                  {cat.name || 'Unnamed Cat'}
                </h3>
                {cat.description && (
                  <p className="cat-description">{cat.description}</p>
                )}
                <div className="cat-details">
                  {cat.color && (
                    <div className="cat-detail">
                      <strong>Color:</strong> {cat.color}
                    </div>
                  )}
                  {cat.size && (
                    <div className="cat-detail">
                      <strong>Size:</strong> {cat.size}
                    </div>
                  )}
                  {cat.date_spotted && (
                    <div className="cat-detail">
                      <strong>Date Spotted:</strong> {formatDate(cat.date_spotted)}
                    </div>
                  )}
                  <div className="cat-detail">
                    <strong>Reported:</strong> {formatDate(cat.created_at)}
                  </div>
                  <div className="cat-detail">
                    <strong>Reported by:</strong>
                    {isAnonymous ? (
                      <span className="anonymous-badge">Anonymous Report</span>
                    ) : (
                      'Community Member'
                    )}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
          )
        })}
        </MapContainer>
      </MobileMapWrapper>

      <div className="map-controls">
        <button
          className="map-control-button"
          onClick={() => setShowLocationSearch(true)}
          title="Search for a location"
        >
          <Search size={18} />
        </button>

        {geolocationService.isSupported() && (
          <button
            className={`map-control-button geolocation-button ${gettingLocation ? 'loading' : ''}`}
            onClick={handleUseMyLocation}
            disabled={gettingLocation}
            title="Use my current location"
          >
            {gettingLocation ? (
              <Loader size={18} className="spinning" />
            ) : (
              <MapPin size={18} />
            )}
          </button>
        )}

        {/* Mobile zoom controls */}
        {isMobile && (
          <>
            <button
              className="map-control-button zoom-button"
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.zoomIn()
                }
              }}
              title="Zoom in"
            >
              <Plus size={18} />
            </button>
            <button
              className="map-control-button zoom-button"
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.zoomOut()
                }
              }}
              title="Zoom out"
            >
              <Minus size={18} />
            </button>
          </>
        )}
      </div>

      {locationError && (
        <div className="location-error">
          <p>{locationError}</p>
          <button onClick={() => setLocationError('')} className="error-close">×</button>
        </div>
      )}

      {showLocationSearch && (
        <LocationSearch
          onLocationSelect={handleLocationSelect}
          onClose={() => setShowLocationSearch(false)}
        />
      )}

      <div className="map-instructions">
        <p>Click anywhere on the map to report a cat</p>
      </div>
    </div>
  )
}

export default CatMap
