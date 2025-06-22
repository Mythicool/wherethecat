import { useEffect, useState } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import './OAuthCallback.css'

function OAuthCallback() {
  const [status, setStatus] = useState('processing')
  const [error, setError] = useState('')

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const auth = getAuth()

        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            console.log('OAuth authentication successful:', user)
            setStatus('success')

            // Redirect to main app after a brief delay
            setTimeout(() => {
              window.location.href = '/'
            }, 2000)
          } else {
            setError('No user found')
            setStatus('error')
          }
        })

        // Clean up listener after 10 seconds
        setTimeout(() => {
          unsubscribe()
          if (status === 'processing') {
            setError('Authentication timeout')
            setStatus('error')
          }
        }, 10000)

      } catch (err) {
        console.error('Unexpected OAuth callback error:', err)
        setError('Authentication failed')
        setStatus('error')
      }
    }

    handleOAuthCallback()
  }, [])

  if (status === 'processing') {
    return (
      <div className="oauth-callback">
        <div className="oauth-callback-content">
          <div className="oauth-spinner"></div>
          <h2>Completing sign in...</h2>
          <p>Please wait while we finish setting up your account.</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="oauth-callback">
        <div className="oauth-callback-content">
          <div className="oauth-success">✓</div>
          <h2>Sign in successful!</h2>
          <p>Redirecting you to the app...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="oauth-callback">
        <div className="oauth-callback-content">
          <div className="oauth-error">✗</div>
          <h2>Sign in failed</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="oauth-retry-button"
          >
            Return to app
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default OAuthCallback
