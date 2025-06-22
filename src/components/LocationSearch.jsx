import { useState, useRef, useEffect } from 'react'
import { Search, MapPin, Navigation, X } from 'lucide-react'
import { geocodingService } from '../services/geocodingService'
import './LocationSearch.css'

function LocationSearch({ onLocationSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const searchTimeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError('')

    try {
      const searchResults = await geocodingService.getCoordinatesFromAddress(searchQuery)
      setResults(searchResults)
    } catch (err) {
      console.error('Search error:', err)
      setError('No locations found. Try a different search term.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setQuery(value)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value)
    }, 500)
  }

  const handleLocationClick = (location) => {
    onLocationSelect({
      lat: location.lat,
      lng: location.lng
    })
    onClose()
  }

  const handleCurrentLocation = async () => {
    setLoading(true)
    setError('')

    try {
      const location = await geocodingService.getCurrentLocation()
      onLocationSelect(location)
      onClose()
    } catch (err) {
      console.error('Geolocation error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="location-search-overlay" onClick={onClose}>
      <div className="location-search-content" onClick={(e) => e.stopPropagation()}>
        <div className="location-search-header">
          <h3>Search Location</h3>
          <button className="close-search" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="search-input-container">
          <Search className="search-input-icon" />
          <input
            type="text"
            placeholder="Search for an address or place..."
            value={query}
            onChange={handleInputChange}
            className="search-input"
            autoFocus
          />
        </div>

        <button 
          className="current-location-button"
          onClick={handleCurrentLocation}
          disabled={loading}
        >
          <Navigation className="current-location-icon" />
          Use Current Location
        </button>

        {error && (
          <div className="search-error">
            {error}
          </div>
        )}

        {loading && (
          <div className="search-loading">
            <div className="search-spinner"></div>
            <span>Searching...</span>
          </div>
        )}

        {results.length > 0 && (
          <div className="search-results">
            <h4>Search Results</h4>
            {results.map((result, index) => (
              <button
                key={index}
                className="search-result-item"
                onClick={() => handleLocationClick(result)}
              >
                <MapPin className="result-icon" />
                <div className="result-details">
                  <div className="result-name">{result.formatted}</div>
                  <div className="result-coords">
                    {result.lat.toFixed(6)}, {result.lng.toFixed(6)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LocationSearch
