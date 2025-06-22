import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth'

class FirebaseService {
  constructor() {
    this.auth = null
    this.isInitialized = false
    this.googleProvider = null
  }

  async initialize() {
    if (this.isInitialized) return

    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    }

    // Check if configuration is complete
    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
      console.error('Firebase configuration missing or incomplete. Please check your environment variables.')
      console.error('Required: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID')
      return
    }

    try {
      // Initialize Firebase
      const app = initializeApp(firebaseConfig)
      this.auth = getAuth(app)

      // Initialize Google provider
      this.googleProvider = new GoogleAuthProvider()
      this.googleProvider.addScope('profile')
      this.googleProvider.addScope('email')

      this.isInitialized = true
      console.log('Firebase client initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Firebase client:', error)
    }
  }

  async signInWithGoogle() {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.auth || !this.googleProvider) {
      throw new Error('Firebase client not initialized')
    }

    try {
      const result = await signInWithPopup(this.auth, this.googleProvider)
      const user = result.user

      console.log('Firebase Google authentication successful:', user)
      return { user, error: null }
    } catch (error) {
      console.error('Firebase Google login error:', error)
      return { user: null, error }
    }
  }

  async signOut() {
    if (!this.auth) return

    try {
      await firebaseSignOut(this.auth)
      console.log('Firebase sign out successful')
      return { error: null }
    } catch (error) {
      console.error('Firebase logout error:', error)
      return { error }
    }
  }

  getCurrentUser() {
    if (!this.auth) return null
    return this.auth.currentUser
  }

  onAuthStateChanged(callback) {
    if (!this.auth) return () => {}
    return onAuthStateChanged(this.auth, callback)
  }

  async isAuthenticated() {
    if (!this.auth) return false
    return !!this.auth.currentUser
  }
}

// Create a singleton instance
export const firebaseService = new FirebaseService()
