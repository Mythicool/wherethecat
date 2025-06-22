import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { firebaseService } from '../services/firebaseService'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize Firebase
    const initializeAuth = async () => {
      await firebaseService.initialize()

      // Set up Firebase auth state listener
      const unsubscribe = firebaseService.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          // Create a user object compatible with Supabase format
          const supabaseUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            user_metadata: {
              full_name: firebaseUser.displayName,
              avatar_url: firebaseUser.photoURL
            },
            app_metadata: {},
            aud: 'authenticated',
            role: 'authenticated'
          }
          setUser(supabaseUser)
          await fetchProfile(firebaseUser.uid)
        } else {
          // Check for Supabase session if no Firebase user
          const { data: { session } } = await supabase.auth.getSession()
          setUser(session?.user ?? null)

          if (session?.user) {
            await fetchProfile(session.user.id)
          } else {
            setProfile(null)
          }
        }
        setLoading(false)
      })

      // Also listen for Supabase auth changes (for email/password users)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          // Only handle Supabase auth if no Firebase user is present
          const firebaseUser = firebaseService.getCurrentUser()
          if (!firebaseUser) {
            setUser(session?.user ?? null)

            if (session?.user) {
              await fetchProfile(session.user.id)
            } else {
              setProfile(null)
            }

            setLoading(false)
          }
        }
      )

      return () => {
        unsubscribe()
        subscription.unsubscribe()
      }
    }

    initializeAuth()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const signUp = async (email, password, fullName) => {
    try {
      console.log('Attempting signup for:', email)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (error) {
        console.error('Signup error:', error)
        return { data, error }
      }

      console.log('Signup successful:', data)

      // If email confirmation is disabled, the user will be logged in immediately
      // If email confirmation is enabled, they need to check their email
      if (data.user && !data.user.email_confirmed_at) {
        console.log('Email confirmation required')
      } else if (data.user) {
        console.log('User logged in immediately')
      }

      return { data, error }
    } catch (err) {
      console.error('Unexpected signup error:', err)
      return { data: null, error: err }
    }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    return { data, error }
  }

  const signOut = async () => {
    try {
      // Check if user is authenticated with Firebase
      const firebaseUser = firebaseService.getCurrentUser()

      if (firebaseUser) {
        // Logout from Firebase
        await firebaseService.signOut()
        setUser(null)
        setProfile(null)
        return { error: null }
      } else {
        // Logout from Supabase
        const { error } = await supabase.auth.signOut()
        return { error }
      }
    } catch (error) {
      console.error('Logout error:', error)
      return { error }
    }
  }

  const signInWithOAuth = async (provider) => {
    try {
      console.log(`Attempting OAuth signin with ${provider}`)

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
        console.error(`${provider} OAuth error:`, error)
        return { data, error }
      }

      console.log(`${provider} OAuth initiated successfully`)
      return { data, error }
    } catch (err) {
      console.error(`Unexpected ${provider} OAuth error:`, err)
      return { data: null, error: err }
    }
  }

  const updateProfile = async (updates) => {
    if (!user) return { error: new Error('No user logged in') }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (!error) {
      setProfile(data)
    }

    return { data, error }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithOAuth,
    updateProfile,
    fetchProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
