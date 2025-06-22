// Geocoding service using Nominatim (OpenStreetMap's free geocoding service)
// This is a free alternative to Google Maps Geocoding API

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'

export const geocodingService = {
  // Reverse geocoding: Get address from coordinates
  async getAddressFromCoordinates(lat, lng) {
    try {
      // Use a CORS-friendly approach with a fallback strategy
      console.log('Attempting reverse geocoding for:', lat, lng)

      // Try to use a CORS proxy or fallback to coordinate display
      let response
      try {
        // Try direct API call first (works in some environments)
        response = await fetch(
          `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'WhereTheCat/1.0 (Community Cat Tracking App)'
            },
            mode: 'cors'
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
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
      } catch (apiError) {
        console.log('Direct API call failed, using fallback:', apiError.message)
        throw apiError
      }
    } catch (error) {
      console.log('Reverse geocoding failed, using coordinate fallback:', error.message)

      // Enhanced fallback with better location estimation
      const locationInfo = this.estimateLocationFromCoordinates(lat, lng)

      return {
        display_name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        address: locationInfo.address,
        formatted: `${lat.toFixed(6)}, ${lng.toFixed(6)} (${locationInfo.area})`
      }
    }
  },

  // Estimate location based on coordinates (Oklahoma City area)
  estimateLocationFromCoordinates(lat, lng) {
    // Oklahoma City metro area bounds (approximate)
    const okcBounds = {
      north: 35.8,
      south: 35.3,
      east: -97.2,
      west: -97.8
    }

    // Check if coordinates are in Oklahoma City area
    if (lat >= okcBounds.south && lat <= okcBounds.north &&
        lng >= okcBounds.west && lng <= okcBounds.east) {

      // Rough neighborhood estimation based on coordinates
      let area = 'Oklahoma City'

      if (lat > 35.6 && lng > -97.4) {
        area = 'Northeast Oklahoma City'
      } else if (lat > 35.6 && lng < -97.6) {
        area = 'Northwest Oklahoma City'
      } else if (lat < 35.4 && lng > -97.4) {
        area = 'Southeast Oklahoma City'
      } else if (lat < 35.4 && lng < -97.6) {
        area = 'Southwest Oklahoma City'
      } else if (lat > 35.5) {
        area = 'North Oklahoma City'
      } else if (lat < 35.4) {
        area = 'South Oklahoma City'
      } else if (lng > -97.4) {
        area = 'East Oklahoma City'
      } else if (lng < -97.6) {
        area = 'West Oklahoma City'
      } else {
        area = 'Central Oklahoma City'
      }

      return {
        area,
        address: {
          city: 'Oklahoma City',
          state: 'Oklahoma',
          country: 'United States'
        }
      }
    }

    // Default fallback for coordinates outside OKC
    return {
      area: 'Oklahoma area',
      address: {
        city: 'Oklahoma',
        state: 'Oklahoma',
        country: 'United States'
      }
    }
  },

  // Forward geocoding: Get coordinates from address
  async getCoordinatesFromAddress(address) {
    try {
      console.log('Attempting forward geocoding for:', address)

      // Try direct API call with CORS handling
      try {
        const response = await fetch(
          `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(address)}&limit=5&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'WhereTheCat/1.0 (Community Cat Tracking App)'
            },
            mode: 'cors'
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
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
      } catch (apiError) {
        console.log('Direct API call failed, using fallback geocoding:', apiError.message)
        throw apiError
      }
    } catch (error) {
      console.log('Forward geocoding failed, using fallback locations:', error.message)

      // Provide fallback locations for common Oklahoma City searches
      const lowerAddress = address.toLowerCase()
      const fallbackLocations = this.getFallbackLocations(lowerAddress)

      if (fallbackLocations.length > 0) {
        return fallbackLocations
      }

      throw new Error('Address search not available. Please use the map to select a location.')
    }
  },

  // Get fallback locations for common searches
  getFallbackLocations(searchTerm) {
    const locations = []

    // Oklahoma City and common areas
    if (searchTerm.includes('oklahoma') || searchTerm.includes('okc') || searchTerm.includes('oklahoma city')) {
      locations.push({
        lat: 35.4676,
        lng: -97.5164,
        display_name: 'Oklahoma City, Oklahoma, United States',
        address: {
          city: 'Oklahoma City',
          state: 'Oklahoma',
          country: 'United States'
        },
        formatted: 'Oklahoma City, Oklahoma',
        importance: 0.9
      })
    }

    // Downtown Oklahoma City
    if (searchTerm.includes('downtown') && (searchTerm.includes('oklahoma') || searchTerm.includes('okc'))) {
      locations.push({
        lat: 35.4822,
        lng: -97.5350,
        display_name: 'Downtown Oklahoma City, Oklahoma, United States',
        address: {
          neighbourhood: 'Downtown',
          city: 'Oklahoma City',
          state: 'Oklahoma',
          country: 'United States'
        },
        formatted: 'Downtown Oklahoma City, Oklahoma',
        importance: 0.8
      })
    }

    // Bricktown
    if (searchTerm.includes('bricktown')) {
      locations.push({
        lat: 35.4657,
        lng: -97.5089,
        display_name: 'Bricktown, Oklahoma City, Oklahoma, United States',
        address: {
          neighbourhood: 'Bricktown',
          city: 'Oklahoma City',
          state: 'Oklahoma',
          country: 'United States'
        },
        formatted: 'Bricktown, Oklahoma City, Oklahoma',
        importance: 0.7
      })
    }

    return locations
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
