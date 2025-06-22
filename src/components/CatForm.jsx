import { useState, useEffect } from 'react'
import { X, MapPin, Cat, Upload, Trash2, Navigation, Loader } from 'lucide-react'
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext'
import { firebaseCatService } from '../services/firebaseCatService'
import { geocodingService } from '../services/geocodingService'
import { geolocationService, GeolocationError } from '../services/geolocationService'
import './CatForm.css'

function CatForm({ location, onSubmit, onClose }) {
  const { user } = useFirebaseAuth()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '',
    size: '',
    date_spotted: new Date().toISOString().split('T')[0] // Today's date
  })
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [address, setAddress] = useState('')
  const [loadingAddress, setLoadingAddress] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(location)
  const [locationError, setLocationError] = useState('')
  const isAnonymous = !user

  // Get address from coordinates when component mounts or location changes
  useEffect(() => {
    if (currentLocation) {
      getAddressFromLocation()
    }
  }, [currentLocation])

  // Update current location when prop changes
  useEffect(() => {
    setCurrentLocation(location)
  }, [location])

  const getAddressFromLocation = async () => {
    if (!currentLocation) return

    setLoadingAddress(true)
    try {
      const addressData = await geocodingService.getAddressFromCoordinates(
        currentLocation.lat,
        currentLocation.lng
      )
      setAddress(addressData.formatted)
    } catch (error) {
      console.error('Error getting address:', error)
      setAddress(`${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`)
    } finally {
      setLoadingAddress(false)
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
      console.log('Form: Starting geolocation request...')
      console.log('Form: User agent:', navigator.userAgent)
      console.log('Form: Is mobile:', geolocationService.isMobile())

      // Check permission first if available
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' })
          console.log('Form: Permission state:', permission.state)
          if (permission.state === 'denied') {
            setLocationError('Location access was denied. Please enable location permissions in your browser settings and try again.')
            return
          }
        } catch (permError) {
          // Permissions API not available, continue with location request
          console.log('Form: Permissions API not available, proceeding with location request')
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

      console.log('Form: Position obtained:', position)
      setCurrentLocation({
        lat: position.lat,
        lng: position.lng,
        accuracy: position.accuracy,
        fromGeolocation: true
      })

      // Show success message for very poor accuracy
      if (position.accuracy > 1000) {
        setLocationError('Location found but accuracy is low. Consider moving to a more open area for better precision.')
      }
    } catch (error) {
      console.error('Form: Geolocation failed:', error)
      const errorMessage = geolocationService.getErrorMessage(error.message)
      setLocationError(errorMessage)
    } finally {
      setGettingLocation(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    // Check if Firebase Storage is available
    try {
      // Limit to 5 photos
      if (photos.length + files.length > 5) {
        alert('You can upload a maximum of 5 photos')
        return
      }

      setUploading(true)
      const uploadResults = await firebaseCatService.uploadCatPhotos(files)

      const newPhotos = uploadResults.map((result, index) => ({
        file: files[index],
        url: result.url,
        path: result.path,
        preview: URL.createObjectURL(files[index])
      }))

      setPhotos(prev => [...prev, ...newPhotos])
    } catch (error) {
      console.error('Error uploading photos:', error)

      // If storage isn't available, just show local previews
      if (error.message.includes('storage') || error.message.includes('Storage')) {
        alert('Photo upload not available. You can still submit the cat report without photos.')

        // Show local previews only
        const localPhotos = files.map((file, index) => ({
          file,
          url: null, // No cloud URL
          path: null,
          preview: URL.createObjectURL(file),
          localOnly: true
        }))

        setPhotos(prev => [...prev, ...localPhotos])
      } else {
        alert(error.message || 'Failed to upload photos. Please try again.')
      }
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = async (index) => {
    const photo = photos[index]
    try {
      if (photo.path) {
        await firebaseCatService.deleteCatPhotos([photo.path])
      }
      URL.revokeObjectURL(photo.preview)
      setPhotos(prev => prev.filter((_, i) => i !== index))
    } catch (error) {
      console.error('Error removing photo:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Only include photos that were successfully uploaded (have URLs)
      const photoUrls = photos
        .filter(photo => photo.url && !photo.localOnly)
        .map(photo => photo.url)

      const catData = {
        ...formData,
        photoUrls: photoUrls, // Use camelCase for Firebase
        dateSpotted: formData.date_spotted, // Convert to camelCase
        location: currentLocation // Include the current location (which may be from geolocation)
      }

      // Remove the snake_case field
      delete catData.date_spotted

      await onSubmit(catData)

      // Close the form after successful submission
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Failed to submit cat report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCoordinates = (lat, lng) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  const getAccuracyClass = (accuracy) => {
    if (accuracy <= 5) return 'accuracy-excellent'
    if (accuracy <= 20) return 'accuracy-good'
    if (accuracy <= 100) return 'accuracy-fair'
    if (accuracy <= 1000) return 'accuracy-poor'
    return 'accuracy-very-poor'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Cat className="modal-icon" />
            <h2>Report a Cat</h2>
          </div>
          <button className="close-button" onClick={onClose}>
            <X className="close-icon" />
          </button>
        </div>

        <div className="location-info">
          <MapPin className="location-icon" />
          <div className="location-details">
            <div className="coordinates">
              {currentLocation && formatCoordinates(currentLocation.lat, currentLocation.lng)}
            </div>
            <div className="address">
              {loadingAddress ? 'Getting address...' : address}
            </div>
            {currentLocation?.fromGeolocation && currentLocation?.accuracy && (
              <div className={`location-accuracy ${getAccuracyClass(currentLocation.accuracy)}`}>
                <span className="accuracy-icon">📍</span>
                GPS accuracy: ~{Math.round(currentLocation.accuracy)}m
                ({geolocationService.getAccuracyDescription(currentLocation.accuracy)})
                {!geolocationService.isAccuracyAcceptable(currentLocation.accuracy) && (
                  <span className="accuracy-warning"> - Consider moving to a more open area</span>
                )}
              </div>
            )}
          </div>
          {geolocationService.isSupported() && (
            <button
              type="button"
              className={`use-location-button ${gettingLocation ? 'loading' : ''}`}
              onClick={handleUseMyLocation}
              disabled={gettingLocation}
              title="Use my current location"
            >
              {gettingLocation ? (
                <Loader size={16} className="spinning" />
              ) : (
                <Navigation size={16} />
              )}
            </button>
          )}
        </div>

        {locationError && (
          <div className="location-error-form">
            <p>{locationError}</p>
            <button type="button" onClick={() => setLocationError('')} className="error-close">×</button>
          </div>
        )}

        {isAnonymous && (
          <div className="anonymous-notice">
            <div className="notice-content">
              <div className="notice-icon">ℹ️</div>
              <div className="notice-text">
                <p><strong>Anonymous Report</strong></p>
                <p>You're submitting this report anonymously. You won't be able to edit or delete it later.</p>
                <p>
                  <a href="#" onClick={(e) => { e.preventDefault(); /* TODO: Open auth modal */ }}>
                    Sign up for free
                  </a> to manage your reports and get notified of updates.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="privacy-notice">
          <div className="notice-content">
            <div className="notice-icon">🔒</div>
            <div className="notice-text">
              <p><strong>Privacy Notice</strong></p>
              <p>Your location data is only used for this cat report and is not stored separately or shared with third parties. We only collect the coordinates needed to place the cat marker on the map.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="cat-form">
          <div className="form-group">
            <label htmlFor="name">Cat Name (optional)</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Fluffy, Orange Cat, etc."
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the cat's appearance, behavior, or any other relevant details..."
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="color">Color</label>
              <select
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
              >
                <option value="">Select color</option>
                <option value="Black">Black</option>
                <option value="White">White</option>
                <option value="Orange/Ginger">Orange/Ginger</option>
                <option value="Gray">Gray</option>
                <option value="Brown">Brown</option>
                <option value="Calico">Calico</option>
                <option value="Tabby">Tabby</option>
                <option value="Tuxedo">Tuxedo</option>
                <option value="Tortoiseshell">Tortoiseshell</option>
                <option value="Mixed">Mixed</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="size">Size</label>
              <select
                id="size"
                name="size"
                value={formData.size}
                onChange={handleChange}
              >
                <option value="">Select size</option>
                <option value="Kitten">Kitten</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="date_spotted">Date Spotted</label>
            <input
              type="date"
              id="date_spotted"
              name="date_spotted"
              value={formData.date_spotted}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label>Photos (optional)</label>
            <div className="photo-upload-section">
              <input
                type="file"
                id="photos"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
              <label htmlFor="photos" className="photo-upload-button">
                <Upload className="upload-icon" />
                {uploading ? 'Uploading...' : 'Add Photos'}
              </label>
              <p className="photo-help-text">
                Upload up to 5 photos (max 5MB each)
              </p>
            </div>

            {photos.length > 0 && (
              <div className="photo-preview-grid">
                {photos.map((photo, index) => (
                  <div key={index} className="photo-preview">
                    <img src={photo.preview} alt={`Cat photo ${index + 1}`} />
                    <button
                      type="button"
                      className="photo-remove-button"
                      onClick={() => removePhoto(index)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={submitting || uploading}
            >
              {submitting ? 'Submitting...' : 'Report Cat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CatForm
