import { useState, useRef, useEffect } from 'react'
import { X, LogIn, UserPlus } from 'lucide-react'
import { useFirebaseAuth } from '../../contexts/FirebaseAuthContext'
import './AuthModal.css'

function AuthModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const modalRef = useRef(null)
  const headerRef = useRef(null)
  const { signInWithGoogle, signInAnonymously } = useFirebaseAuth()

  // Reset position when modal opens
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 })
      setIsDragging(false)
    }
  }, [isOpen])

  // Drag functionality
  const handleMouseDown = (e) => {
    // Only enable dragging on desktop (not mobile)
    if (window.innerWidth <= 768) return

    const rect = modalRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setIsDragging(true)
    e.preventDefault()
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const modalWidth = modalRef.current.offsetWidth
    const modalHeight = modalRef.current.offsetHeight

    let newX = e.clientX - dragOffset.x - viewportWidth / 2 + modalWidth / 2
    let newY = e.clientY - dragOffset.y - viewportHeight / 2 + modalHeight / 2

    // Constrain to viewport
    const margin = 20
    newX = Math.max(-viewportWidth / 2 + margin, Math.min(viewportWidth / 2 - modalWidth - margin, newX))
    newY = Math.max(-viewportHeight / 2 + margin, Math.min(viewportHeight / 2 - modalHeight - margin, newY))

    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError('')
      await signInWithGoogle()
      onClose()
    } catch (err) {
      console.error('Google sign in error:', err)
      setError('Failed to sign in with Google. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnonymousSignIn = async () => {
    try {
      setLoading(true)
      setError('')
      await signInAnonymously()
      onClose()
    } catch (err) {
      console.error('Anonymous sign in error:', err)
      setError('Failed to continue anonymously. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="auth-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        <div
          ref={headerRef}
          className="auth-modal-header"
          onMouseDown={handleMouseDown}
          style={{ cursor: window.innerWidth > 768 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          <h2>Sign In to Where The Cat?</h2>
          <button className="auth-close-button" onClick={onClose}>
            <X className="auth-close-icon" />
          </button>
        </div>

        <div className="auth-content">
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="auth-options">
            <button
              className="auth-option-button google-button"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <button
              className="auth-option-button anonymous-button"
              onClick={handleAnonymousSignIn}
              disabled={loading}
            >
              <UserPlus className="auth-button-icon" />
              {loading ? 'Continuing...' : 'Continue Anonymously'}
            </button>
          </div>

          <div className="auth-info">
            <p className="auth-info-text">
              <strong>Anonymous users</strong> can report cats but won't be able to manage their reports later.
            </p>
            <p className="auth-info-text">
              <strong>Google sign-in</strong> allows you to manage your reports and get updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthModal
