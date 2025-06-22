import { useState, useEffect } from 'react'
import { MapPin, Heart, Info, AlertCircle, Filter } from 'lucide-react'
import { FirebaseAuthProvider, useFirebaseAuth } from './contexts/FirebaseAuthContext'
import { firebaseCatService } from './services/firebaseCatService'
import CatMap from './components/CatMap'
import CatForm from './components/CatForm'
import Header from './components/Header'
import AuthModal from './components/Auth/AuthModal'
import SearchFilters from './components/SearchFilters'
import SetupNotification from './components/SetupNotification'
import MobileDebugInfo from './components/MobileDebugInfo'
import AdminDashboard from './components/Admin/AdminDashboard'
import './App.css'

function AppContent() {
  const { user, userProfile, loading: authLoading } = useFirebaseAuth()
  const [cats, setCats] = useState([])
  const [filteredCats, setFilteredCats] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState({})
  const [currentView, setCurrentView] = useState('map') // 'map' or 'admin'
  const [unsubscribe, setUnsubscribe] = useState(null)

  // Load cats from Firebase on component mount
  useEffect(() => {
    loadCats()
  }, [])

  // Set up real-time subscription to Firebase
  useEffect(() => {
    const unsubscribeFunction = firebaseCatService.onCatsSnapshot(
      (updatedCats) => {
        console.log('Real-time update from Firebase:', updatedCats)
        setCats(updatedCats)
        setFilteredCats(updatedCats)
      },
      { status: 'active' }
    )

    setUnsubscribe(() => unsubscribeFunction)

    return () => {
      if (unsubscribeFunction) {
        unsubscribeFunction()
      }
    }
  }, [])

  const loadCats = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await firebaseCatService.getAllCats()
      setCats(data)
      setFilteredCats(data)
    } catch (err) {
      console.error('Error loading cats from Firebase:', err)
      setError('Failed to load cat reports. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltersChange = async (filters) => {
    setActiveFilters(filters)

    // Check if any filters are active
    const hasActiveFilters = Object.values(filters).some(value =>
      value !== '' && value !== 10
    )

    if (!hasActiveFilters) {
      setFilteredCats(cats)
      return
    }

    // For now, implement basic client-side filtering
    // TODO: Implement server-side filtering with Firestore queries
    let filtered = [...cats]

    if (filters.color && filters.color !== '') {
      filtered = filtered.filter(cat =>
        cat.color?.toLowerCase().includes(filters.color.toLowerCase())
      )
    }

    if (filters.size && filters.size !== '') {
      filtered = filtered.filter(cat =>
        cat.size?.toLowerCase() === filters.size.toLowerCase()
      )
    }

    setFilteredCats(filtered)
  }

  const handleMapClick = (location) => {
    setSelectedLocation(location)
    setShowForm(true)
  }

  const handleAddCat = async (catData) => {
    try {
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

      const newCat = await firebaseCatService.createCat(newCatData)
      // Real-time subscription will handle adding to the list
      setShowForm(false)
      setSelectedLocation(null)

      // Show success message with different content for anonymous users
      if (!user || user.isAnonymous) {
        alert('Cat report submitted successfully! Thank you for helping the community. Sign up to manage your reports and get updates.')
      }
    } catch (err) {
      console.error('Error adding cat:', err)
      alert('Failed to submit cat report. Please try again.')
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setSelectedLocation(null)
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
        <AdminDashboard />
      ) : (
        <main className="main-content">
          <div className="map-container">
            <CatMap
              cats={filteredCats}
              onMapClick={handleMapClick}
            />
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
            <SearchFilters
              onFiltersChange={handleFiltersChange}
              onClose={() => setShowFilters(false)}
            />
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
        <CatForm
          location={selectedLocation}
          onSubmit={handleAddCat}
          onClose={handleCloseForm}
        />
      )}

      <AuthModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        initialMode="signup"
      />

      <MobileDebugInfo />
    </div>
  )
}

function App() {
  return (
    <FirebaseAuthProvider>
      <SetupNotification />
      <AppContent />
    </FirebaseAuthProvider>
  )
}

export default App
