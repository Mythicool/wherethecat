// Geocoding service using Nominatim (OpenStreetMap's free geocoding service)
// This is a free alternative to Google Maps Geocoding API

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'

export const geocodingService = {
  // Reverse geocoding: Get address from coordinates
  async getAddressFromCoordinates(lat, lng) {
    try {
      // For development, skip the API call and return coordinates
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Development mode: Skipping geocoding API call due to CORS restrictions')
        return {
          display_name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          address: {
            city: 'Oklahoma City',
            state: 'Oklahoma',
            country: 'United States'
          },
          formatted: `${lat.toFixed(6)}, ${lng.toFixed(6)} (Oklahoma City, OK)`
        }
      }

      const response = await fetch(
        `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'WhereTheCat/1.0 (Community Cat Tracking App)'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch address')
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      return {
        display_name: data.display_name,
        address: {
          house_number: data.address?.house_number,
          road: data.address?.road,
          neighbourhood: data.address?.neighbourhood,
          suburb: data.address?.suburb,
          city: data.address?.city || data.address?.town || data.address?.village,
          state: data.address?.state,
          postcode: data.address?.postcode,
          country: data.address?.country
        },
        formatted: this.formatAddress(data.address)
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      // Provide a fallback with coordinates and estimated location
      return {
        display_name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        address: {
          city: 'Oklahoma City',
          state: 'Oklahoma',
          country: 'United States'
        },
        formatted: `${lat.toFixed(6)}, ${lng.toFixed(6)} (Oklahoma City area)`
      }
    }
  },

  // Forward geocoding: Get coordinates from address
  async getCoordinatesFromAddress(address) {
    try {
      // For development, provide a fallback for Oklahoma City
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Development mode: Using fallback geocoding for:', address)

        // Simple fallback for common Oklahoma City searches
        const lowerAddress = address.toLowerCase()
        if (lowerAddress.includes('oklahoma') || lowerAddress.includes('okc')) {
          return [{
            lat: 35.4676,
            lng: -97.5164,
            display_name: 'Oklahoma City, Oklahoma, United States',
            address: {
              city: 'Oklahoma City',
              state: 'Oklahoma',
              country: 'United States'
            },
            formatted: 'Oklahoma City, Oklahoma',
            importance: 0.8
          }]
        }

        throw new Error('Geocoding not available in development mode')
      }

      const response = await fetch(
        `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(address)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'WhereTheCat/1.0 (Community Cat Tracking App)'
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to search address')
      }

      const data = await response.json()

      if (!data || data.length === 0) {
        throw new Error('No results found')
      }

      return data.map(result => ({
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        display_name: result.display_name,
        address: result.address,
        formatted: this.formatAddress(result.address),
        importance: result.importance
      }))
    } catch (error) {
      console.error('Forward geocoding error:', error)
      throw error
    }
  },

  // Format address for display
  formatAddress(address) {
    if (!address) return ''

    const parts = []
    
    if (address.house_number && address.road) {
      parts.push(`${address.house_number} ${address.road}`)
    } else if (address.road) {
      parts.push(address.road)
    }

    if (address.neighbourhood) {
      parts.push(address.neighbourhood)
    } else if (address.suburb) {
      parts.push(address.suburb)
    }

    if (address.city || address.town || address.village) {
      parts.push(address.city || address.town || address.village)
    }

    if (address.state) {
      parts.push(address.state)
    }

    return parts.join(', ')
  },

  // Get user's current location
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
        },
        (error) => {
          let message = 'Unable to get your location'
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location access denied by user'
              break
            case error.POSITION_UNAVAILABLE:
              message = 'Location information is unavailable'
              break
            case error.TIMEOUT:
              message = 'Location request timed out'
              break
          }
          
          reject(new Error(message))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  },

  // Calculate distance between two points (in kilometers)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    
    return distance
  },

  toRadians(degrees) {
    return degrees * (Math.PI / 180)
  }
}
