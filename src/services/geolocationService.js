/**
 * Geolocation Service
 * Handles GPS location requests, permissions, and error handling
 */

export const GeolocationError = {
  NOT_SUPPORTED: 'NOT_SUPPORTED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  POSITION_UNAVAILABLE: 'POSITION_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN'
}

export const geolocationService = {
  /**
   * Check if geolocation is supported by the browser
   */
  isSupported() {
    return 'geolocation' in navigator
  },

  /**
   * Check if we're on a mobile device
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  },

  /**
   * Check if we're on iOS Safari
   */
  isIOSSafari() {
    const ua = navigator.userAgent
    const iOS = /iPad|iPhone|iPod/.test(ua)
    const webkit = /WebKit/.test(ua)
    return iOS && webkit && !/(CriOS|FxiOS|OPiOS|mercury)/i.test(ua)
  },

  /**
   * Get user's current position
   * @param {Object} options - Geolocation options
   * @returns {Promise<{lat: number, lng: number, accuracy: number}>}
   */
  async getCurrentPosition(options = {}) {
    if (!this.isSupported()) {
      throw new Error(GeolocationError.NOT_SUPPORTED)
    }

    // Mobile-optimized default options
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 30000, // 30 seconds for mobile (GPS can be slow)
      maximumAge: 60000 // 1 minute cache for mobile
    }

    const finalOptions = { ...defaultOptions, ...options }

    return new Promise((resolve, reject) => {
      // Add mobile-specific debugging
      console.log('Requesting geolocation with options:', finalOptions)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Geolocation success:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          })

          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          })
        },
        (error) => {
          console.error('Geolocation error:', {
            code: error.code,
            message: error.message,
            PERMISSION_DENIED: error.PERMISSION_DENIED,
            POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
            TIMEOUT: error.TIMEOUT
          })

          let errorType
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorType = GeolocationError.PERMISSION_DENIED
              break
            case error.POSITION_UNAVAILABLE:
              errorType = GeolocationError.POSITION_UNAVAILABLE
              break
            case error.TIMEOUT:
              errorType = GeolocationError.TIMEOUT
              break
            default:
              errorType = GeolocationError.UNKNOWN
          }
          reject(new Error(errorType))
        },
        finalOptions
      )
    })
  },

  /**
   * Mobile-optimized position request with fallback strategies
   * @param {Object} options - Geolocation options
   * @returns {Promise<{lat: number, lng: number, accuracy: number}>}
   */
  async getMobilePosition(options = {}) {
    if (!this.isSupported()) {
      throw new Error(GeolocationError.NOT_SUPPORTED)
    }

    // Try high accuracy first, then fallback to lower accuracy
    const strategies = [
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000
      }
    ]

    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`Trying geolocation strategy ${i + 1}:`, strategies[i])
        const position = await this.getCurrentPosition(strategies[i])
        console.log(`Strategy ${i + 1} succeeded`)
        return position
      } catch (error) {
        console.log(`Strategy ${i + 1} failed:`, error.message)

        // If it's a permission error, don't try other strategies
        if (error.message === GeolocationError.PERMISSION_DENIED) {
          throw error
        }

        // If this is the last strategy, throw the error
        if (i === strategies.length - 1) {
          throw error
        }
      }
    }
  },

  /**
   * Watch user's position for continuous updates
   * @param {Function} callback - Called with position updates
   * @param {Function} errorCallback - Called with errors
   * @param {Object} options - Geolocation options
   * @returns {number} Watch ID for clearing the watch
   */
  watchPosition(callback, errorCallback, options = {}) {
    if (!this.isSupported()) {
      errorCallback(new Error(GeolocationError.NOT_SUPPORTED))
      return null
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // 1 minute
    }

    const finalOptions = { ...defaultOptions, ...options }

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        })
      },
      (error) => {
        let errorType
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorType = GeolocationError.PERMISSION_DENIED
            break
          case error.POSITION_UNAVAILABLE:
            errorType = GeolocationError.POSITION_UNAVAILABLE
            break
          case error.TIMEOUT:
            errorType = GeolocationError.TIMEOUT
            break
          default:
            errorType = GeolocationError.UNKNOWN
        }
        errorCallback(new Error(errorType))
      },
      finalOptions
    )
  },

  /**
   * Clear position watch
   * @param {number} watchId - Watch ID returned by watchPosition
   */
  clearWatch(watchId) {
    if (watchId && this.isSupported()) {
      navigator.geolocation.clearWatch(watchId)
    }
  },

  /**
   * Get user-friendly error message
   * @param {string} errorType - Error type from GeolocationError
   * @returns {string} User-friendly error message
   */
  getErrorMessage(errorType) {
    const isMobile = this.isMobile()
    const isIOSSafari = this.isIOSSafari()

    switch (errorType) {
      case GeolocationError.NOT_SUPPORTED:
        return 'Geolocation is not supported by your browser.'
      case GeolocationError.PERMISSION_DENIED:
        if (isIOSSafari) {
          return 'Location access was denied. On iPhone: Go to Settings > Safari > Location Services and enable location access, then refresh this page.'
        } else if (isMobile) {
          return 'Location access was denied. Please enable location permissions in your browser settings and refresh the page.'
        } else {
          return 'Location access was denied. Please enable location permissions and try again.'
        }
      case GeolocationError.POSITION_UNAVAILABLE:
        if (isMobile) {
          return 'Your location is currently unavailable. Try moving to an area with better GPS signal or use WiFi for location services.'
        } else {
          return 'Your location is currently unavailable. Please try again or select a location manually.'
        }
      case GeolocationError.TIMEOUT:
        if (isMobile) {
          return 'Location request timed out. This can happen indoors or in areas with poor GPS signal. Try moving outside or select a location manually.'
        } else {
          return 'Location request timed out. Please try again or select a location manually.'
        }
      default:
        return 'An error occurred while getting your location. Please try again or select a location manually.'
    }
  },

  /**
   * Get accuracy description based on accuracy value
   * @param {number} accuracy - Accuracy in meters
   * @returns {string} Accuracy description
   */
  getAccuracyDescription(accuracy) {
    if (accuracy <= 5) {
      return 'Very High'
    } else if (accuracy <= 20) {
      return 'High'
    } else if (accuracy <= 100) {
      return 'Medium'
    } else if (accuracy <= 1000) {
      return 'Low'
    } else {
      return 'Very Low'
    }
  },

  /**
   * Check if accuracy is good enough for cat reporting
   * @param {number} accuracy - Accuracy in meters
   * @returns {boolean} True if accuracy is acceptable
   */
  isAccuracyAcceptable(accuracy) {
    return accuracy <= 1000 // Accept up to 1km accuracy
  },

  /**
   * Request permission for geolocation (for browsers that support it)
   * @returns {Promise<string>} Permission state
   */
  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error(GeolocationError.NOT_SUPPORTED)
    }

    // Check if permissions API is available
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        return permission.state // 'granted', 'denied', or 'prompt'
      } catch (error) {
        // Fallback to trying to get position
        console.warn('Permissions API not available, falling back to position request')
      }
    }

    // Fallback: try to get position to trigger permission prompt
    try {
      await this.getCurrentPosition({ timeout: 1000 })
      return 'granted'
    } catch (error) {
      if (error.message === GeolocationError.PERMISSION_DENIED) {
        return 'denied'
      }
      return 'prompt'
    }
  }
}
