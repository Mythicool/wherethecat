import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import './OAuthCallback.css'

function OAuthCallback() {
  const [status, setStatus] = useState('processing')
  const [error, setError] = useState('')

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Handle standard OAuth callback (for GitHub, etc.)
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('OAuth callback error:', error)
          setError(error.message)
          setStatus('error')
          return
        }

        if (data.session) {
          console.log('OAuth authentication successful:', data.session.user)
          setStatus('success')

          // Redirect to main app after a brief delay
          setTimeout(() => {
            window.location.href = '/'
          }, 2000)
        } else {
          setError('No session found')
          setStatus('error')
        }
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
