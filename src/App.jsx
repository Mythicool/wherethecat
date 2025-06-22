import { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react'
import { MapPin, Heart, Info, AlertCircle, Filter } from 'lucide-react'
import { FirebaseAuthProvider, useFirebaseAuth } from './contexts/FirebaseAuthContext'
import { firebaseCatService } from './services/firebaseCatService'
import Header from './components/Header'
import MobileDebugInfo from './components/MobileDebugInfo'
import LoadingSkeleton from './components/LoadingSkeleton'
import { measureAsync, perfMonitor, initWebVitals } from './utils/performance'
import './App.css'

// Lazy load heavy components
const CatMap = lazy(() => import('./components/CatMap'))
const CatForm = lazy(() => import('./components/CatForm'))
const AuthModal = lazy(() => import('./components/Auth/AuthModal'))
const SearchFilters = lazy(() => import('./components/SearchFilters'))
const AdminDashboard = lazy(() => import('./components/Admin/AdminDashboard'))

function AppContent() {
  const { user, userProfile, loading: authLoading } = useFirebaseAuth()
  const [cats, setCats] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState({})
  const [currentView, setCurrentView] = useState('map') // 'map' or 'admin'

  // Load cats from Firebase on component mount
  useEffect(() => {
    loadCats()
  }, [])

  // Set up real-time subscription to Firebase
  useEffect(() => {
    console.log('Setting up Firebase real-time listener...')
    const unsubscribeFunction = firebaseCatService.onCatsSnapshot(
      (updatedCats) => {
        console.log('Real-time update from Firebase:', updatedCats.length, 'cats received')
        console.log('First cat sample:', updatedCats[0])
        setCats(updatedCats)

        // Apply current filters to the updated cats
        applyFiltersToUpdatedCats(updatedCats)
      },
      { status: 'active' }
    )



    return () => {
      console.log('Cleaning up Firebase real-time listener...')
      if (unsubscribeFunction) {
        unsubscribeFunction()
      }
    }
  }, [activeFilters]) // Re-subscribe when filters change

  // Initial load and performance monitoring setup
  useEffect(() => {
    // Initialize performance monitoring
    initWebVitals()

    // Load cats data
    loadCats()

    // Log performance info after initial load
    setTimeout(() => {
      console.log('📊 Performance Summary:', perfMonitor.getAllMeasures())
    }, 2000)
  }, [])

  // Memoized filtered cats calculation
  const filteredCats = useMemo(() => {
    // Check if any filters are active
    const hasActiveFilters = Object.values(activeFilters).some(value =>
      value !== '' && value !== 10
    )

    if (!hasActiveFilters) {
      return cats
    }

    // Apply filters
    let filtered = [...cats]

    if (activeFilters.color && activeFilters.color !== '') {
      filtered = filtered.filter(cat =>
        cat.color?.toLowerCase().includes(activeFilters.color.toLowerCase())
      )
    }

    if (activeFilters.size && activeFilters.size !== '') {
      filtered = filtered.filter(cat =>
        cat.size?.toLowerCase() === activeFilters.size.toLowerCase()
      )
    }

    return filtered
  }, [cats, activeFilters])

  // Helper function to apply filters to cats
  const applyFiltersToUpdatedCats = useCallback((cats) => {
    // Update the cats state, filteredCats will be recalculated automatically
    setCats(cats)
  }, [])

  const loadCats = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await measureAsync('loadCats', () => firebaseCatService.getAllCats())
      setCats(data)
    } catch (err) {
      console.error('Error loading cats from Firebase:', err)
      setError('Failed to load cat reports. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltersChange = useCallback(async (filters) => {
    setActiveFilters(filters)
  }, [])

  const handleMapClick = useCallback((location) => {
    setSelectedLocation(location)
    setShowForm(true)
  }, [])

  const handleCloseForm = useCallback(() => {
    setShowForm(false)
    setSelectedLocation(null)
  }, [])

  const handleAddCat = async (catData) => {
    try {
      console.log('Adding new cat:', catData)
      // Use location from catData if available (from geolocation), otherwise use selectedLocation
      const locationToUse = catData.location || selectedLocation

      const newCatData = {
        ...catData,
        latitude: locationToUse.lat,
        longitude: locationToUse.lng,
        status: 'active'
      }

      // Remove the location object from catData as it's not a database field
      delete newCatData.location

      console.log('Submitting cat data to Firebase:', newCatData)
      const result = await firebaseCatService.createCat(newCatData)
      console.log('Cat created successfully:', result)

      // Real-time subscription will handle adding to the list
      setShowForm(false)
      setSelectedLocation(null)

      // Show success message with different content for anonymous users
      if (!user || user.isAnonymous) {
        alert('Cat report submitted successfully! Thank you for helping the community. Sign up to manage your reports and get updates.')
      } else {
        alert('Cat report submitted successfully!')
      }
    } catch (err) {
      console.error('Error adding cat:', err)
      alert('Failed to submit cat report. Please try again.')
    }
  }



  if (authLoading || loading) {
    return (
      <div className="app">
        <Header />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        isAdmin={userProfile?.isAdmin}
      />

      {currentView === 'admin' ? (
        <Suspense fallback={
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading admin dashboard...</p>
          </div>
        }>
          <AdminDashboard />
        </Suspense>
      ) : (
        <main className="main-content">
          <div className="map-container">
            <Suspense fallback={<LoadingSkeleton type="map" />}>
              <CatMap
                cats={filteredCats}
                onMapClick={handleMapClick}
              />
            </Suspense>
          </div>

        <div className="info-panel">
          {error && (
            <div className="error-message">
              <AlertCircle className="error-icon" />
              <p>{error}</p>
              <button onClick={loadCats} className="retry-button">
                Retry
              </button>
            </div>
          )}

          <div className="panel-actions">
            <button
              className="filter-toggle-button"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="filter-toggle-icon" />
              Filters
            </button>
          </div>

          {showFilters && (
            <Suspense fallback={<div>Loading filters...</div>}>
              <SearchFilters
                onFiltersChange={handleFiltersChange}
                onClose={() => setShowFilters(false)}
              />
            </Suspense>
          )}

          <div className="stats">
            <div className="stat-item">
              <MapPin className="stat-icon" />
              <span className="stat-number">{filteredCats.length}</span>
              <span className="stat-label">
                {filteredCats.length === cats.length ? 'Cats Reported' : 'Cats Found'}
              </span>
            </div>
          </div>

          <div className="instructions">
            <div className="instruction-item">
              <Info className="instruction-icon" />
              <p>
                Click anywhere on the map to report a homeless or lost cat
                {!user && " (anonymous reports welcome!)"}
              </p>
            </div>
            <div className="instruction-item">
              <Heart className="instruction-icon" />
              <p>Help build a community-driven database to assist with cat rescue efforts</p>
            </div>
          </div>
        </div>
        </main>
      )}

      {showForm && (
        <Suspense fallback={
          <div className="modal-overlay">
            <LoadingSkeleton type="form" />
          </div>
        }>
          <CatForm
            location={selectedLocation}
            onSubmit={handleAddCat}
            onClose={handleCloseForm}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <AuthModal
          isOpen={showAuthPrompt}
          onClose={() => setShowAuthPrompt(false)}
          initialMode="signup"
        />
      </Suspense>

      <MobileDebugInfo />
    </div>
  )
}

function App() {
  return (
    <FirebaseAuthProvider>
      <AppContent />
    </FirebaseAuthProvider>
  )
}

export default App
