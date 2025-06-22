import { useState } from 'react'
import { Cat, Github, Heart, User, LogIn, Shield, Map } from 'lucide-react'
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext'
import AuthModal from './Auth/AuthModal'
import UserProfile from './Auth/UserProfile'
import './Header.css'

function Header({ currentView, onViewChange, isAdmin }) {
  const { user, userProfile } = useFirebaseAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <Cat className="logo-icon" />
            <h1 className="app-title">Where The Cat?</h1>
            <span className="app-subtitle">Community Cat Tracking</span>
          </div>

          <div className="header-actions">
            {/* Navigation buttons */}
            {user && (
              <div className="nav-buttons">
                <button
                  className={`nav-button ${currentView === 'map' ? 'active' : ''}`}
                  onClick={() => onViewChange('map')}
                  title="Map View"
                >
                  <Map className="header-icon" />
                  <span>Map</span>
                </button>

                {isAdmin && (
                  <button
                    className={`nav-button ${currentView === 'admin' ? 'active' : ''}`}
                    onClick={() => onViewChange('admin')}
                    title="Admin Dashboard"
                  >
                    <Shield className="header-icon" />
                    <span>Admin</span>
                  </button>
                )}
              </div>
            )}

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="header-link"
              title="View on GitHub"
            >
              <Github className="header-icon" />
            </a>

            <div className="support-text">
              <Heart className="heart-icon" />
              <span>Help cats find homes</span>
            </div>

            {user ? (
              <button
                className="user-button"
                onClick={() => setShowUserProfile(true)}
                title="User Profile"
              >
                <User className="header-icon" />
                <span className="user-name">{user?.displayName || userProfile?.displayName || 'User'}</span>
                {isAdmin && <Shield className="admin-badge" size={12} />}
              </button>
            ) : (
              <button
                className="auth-button"
                onClick={() => setShowAuthModal(true)}
              >
                <LogIn className="header-icon" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {showUserProfile && (
        <UserProfile onClose={() => setShowUserProfile(false)} />
      )}
    </>
  )
}

export default Header
