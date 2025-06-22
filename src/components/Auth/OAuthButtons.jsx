import { useState } from 'react'
import { Github } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { firebaseService } from '../../services/firebaseService'
import './OAuthButtons.css'

// Google icon component (since Lucide doesn't have it)
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

// Facebook icon component
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
  </svg>
)

// Firebase/Google icon component (using the existing GoogleIcon)
const FirebaseIcon = GoogleIcon

function OAuthButtons({ mode, onSuccess, onError }) {
  const [loading, setLoading] = useState({
    firebase: false,
    github: false,
    facebook: false
  })

  const handleOAuthSignIn = async (provider) => {
    try {
      setLoading(prev => ({ ...prev, [provider]: true }))
      onError('') // Clear any existing errors

      if (provider === 'firebase') {
        // Handle Firebase Google authentication
        try {
          const { user, error } = await firebaseService.signInWithGoogle()

          if (error) {
            throw error
          }

          if (user) {
            console.log('Firebase authentication successful:', user)
            onSuccess && onSuccess()
          }
          return
        } catch (firebaseError) {
          console.error('Firebase login error:', firebaseError)
          onError('Firebase authentication error. Please try again.')
          return
        }
      }

      // Handle standard OAuth providers
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        throw error
      }

      // The redirect will happen automatically
      // onSuccess will be called after redirect

    } catch (error) {
      console.error(`${provider} OAuth error:`, error)
      onError(error.message || `Failed to sign in with ${provider}`)
    } finally {
      setLoading(prev => ({ ...prev, [provider]: false }))
    }
  }

  const oauthProviders = [
    {
      id: 'firebase',
      name: 'Google',
      icon: FirebaseIcon,
      color: '#4285F4',
      enabled: true // Firebase Google authentication is now configured and enabled
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      color: '#333',
      enabled: false // Temporarily disabled until OAuth is configured
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: FacebookIcon,
      color: '#1877F2',
      enabled: false // Disabled by default, can be enabled later
    }
  ]

  const enabledProviders = oauthProviders.filter(provider => provider.enabled)

  // Don't render anything if no providers are enabled
  if (enabledProviders.length === 0) {
    return null
  }

  return (
    <div className="oauth-buttons">
      {enabledProviders.map(provider => {
        const Icon = provider.icon
        const isLoading = loading[provider.id]

        return (
          <button
            key={provider.id}
            type="button"
            className={`oauth-button oauth-${provider.id}`}
            onClick={() => handleOAuthSignIn(provider.id)}
            disabled={isLoading}
            style={{ '--provider-color': provider.color }}
          >
            {isLoading ? (
              <div className="oauth-spinner"></div>
            ) : (
              <Icon />
            )}
            <span>
              {mode === 'signin' ? 'Sign in' : 'Sign up'} with {provider.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default OAuthButtons
