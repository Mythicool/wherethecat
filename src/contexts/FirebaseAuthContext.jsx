import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const FirebaseAuthContext = createContext({})

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext)
  if (!context) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider')
  }
  return context
}

export function FirebaseAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Handle redirect result first
    const handleRedirect = async () => {
      try {
        await authService.handleRedirectResult()
      } catch (error) {
        console.error('Error handling redirect:', error)
      }
    }

    handleRedirect()

    // Listen to authentication state changes
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      try {
        setLoading(true)

        if (firebaseUser) {
          setUser(firebaseUser)

          // Get user profile from Firestore
          const profile = await authService.getUserDocument(firebaseUser.uid)
          setUserProfile(profile)
        } else {
          setUser(null)
          setUserProfile(null)
        }
      } catch (error) {
        console.error('Error in auth state change:', error)
        setUser(null)
        setUserProfile(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      const user = await authService.signInWithGoogle()
      return user
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInAnonymously = async () => {
    try {
      setLoading(true)
      const user = await authService.signInAnonymously()
      return user
    } catch (error) {
      console.error('Error signing in anonymously:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await authService.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates) => {
    try {
      await authService.updateUserProfile(updates)
      
      // Refresh user profile
      if (user) {
        const updatedProfile = await authService.getUserDocument(user.uid)
        setUserProfile(updatedProfile)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    signInWithGoogle,
    signInAnonymously,
    signOut,
    updateProfile,
    isSignedIn: !!user,
    isAnonymous: user?.isAnonymous || false
  }

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  )
}
