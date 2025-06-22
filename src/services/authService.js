import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, COLLECTIONS } from '../lib/firebase'

// Google Auth Provider
const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('email')
googleProvider.addScope('profile')

export const authService = {
  // Sign in with Google (try popup first, fallback to redirect)
  async signInWithGoogle() {
    try {
      console.log('Attempting Google sign-in with popup...')

      // Check if we're in a mobile environment or if popups are likely to be blocked
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

      if (isMobile) {
        console.log('Mobile detected, using redirect flow')
        await signInWithRedirect(auth, googleProvider)
        return null // Will be handled by redirect result
      }

      // Try popup first for desktop
      const result = await signInWithPopup(auth, googleProvider)
      console.log('Popup sign-in successful:', result)
      const user = result.user

      // Create or update user document in Firestore
      await this.createUserDocument(user)

      return user
    } catch (error) {
      console.error('Popup failed, trying redirect:', error)

      // If popup fails, try redirect
      if (error.code === 'auth/popup-blocked' ||
          error.code === 'auth/popup-closed-by-user' ||
          error.code === 'auth/network-request-failed' ||
          error.message.includes('CSP')) {
        console.log('Falling back to redirect flow')
        await signInWithRedirect(auth, googleProvider)
        return null // Will be handled by redirect result
      }

      throw error
    }
  },

  // Handle redirect result (call this on app startup)
  async handleRedirectResult() {
    try {
      const result = await getRedirectResult(auth)
      if (result?.user) {
        await this.createUserDocument(result.user)
        return result.user
      }
      return null
    } catch (error) {
      console.error('Error handling redirect result:', error)
      throw error
    }
  },

  // Sign in anonymously
  async signInAnonymously() {
    try {
      const result = await signInAnonymously(auth)
      return result.user
    } catch (error) {
      console.error('Error signing in anonymously:', error)
      throw error
    }
  },

  // Sign out
  async signOut() {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  },

  // Create or update user document in Firestore
  async createUserDocument(user) {
    if (!user) return

    const userRef = doc(db, COLLECTIONS.USERS, user.uid)
    const userSnap = await getDoc(userRef)

    // Only create document if it doesn't exist
    if (!userSnap.exists()) {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isAnonymous: user.isAnonymous,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      await setDoc(userRef, userData)
    } else {
      // Update existing user document with latest info
      const updateData = {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        updatedAt: serverTimestamp()
      }

      await setDoc(userRef, updateData, { merge: true })
    }
  },

  // Get user document from Firestore
  async getUserDocument(uid) {
    if (!uid) return null

    try {
      const userRef = doc(db, COLLECTIONS.USERS, uid)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() }
      }
      
      return null
    } catch (error) {
      console.error('Error getting user document:', error)
      return null
    }
  },

  // Update user profile
  async updateUserProfile(updates) {
    try {
      const user = auth.currentUser
      if (!user) throw new Error('No user signed in')

      // Update Firebase Auth profile
      if (updates.displayName || updates.photoURL) {
        await updateProfile(user, {
          displayName: updates.displayName || user.displayName,
          photoURL: updates.photoURL || user.photoURL
        })
      }

      // Update Firestore document
      const userRef = doc(db, COLLECTIONS.USERS, user.uid)
      await setDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true })

      return true
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  },

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback)
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser
  },

  // Check if user is signed in
  isSignedIn() {
    return !!auth.currentUser
  },

  // Check if user is anonymous
  isAnonymous() {
    return auth.currentUser?.isAnonymous || false
  }
}
