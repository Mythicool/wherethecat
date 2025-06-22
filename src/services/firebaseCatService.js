import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore'
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage'
import { db, storage, COLLECTIONS, STORAGE_PATHS } from '../lib/firebase'
import { authService } from './authService'

export const firebaseCatService = {
  // Get all active cats with optional limit for performance
  async getAllCats(limitCount = 100) {
    try {
      const catsRef = collection(db, COLLECTIONS.CATS)
      let q = query(
        catsRef,
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      )

      // Add limit for better performance
      if (limitCount) {
        q = query(q, limit(limitCount))
      }

      const querySnapshot = await getDocs(q)
      const cats = []

      querySnapshot.forEach((doc) => {
        cats.push({ id: doc.id, ...doc.data() })
      })

      console.log(`Loaded ${cats.length} cats from Firebase`)
      return cats
    } catch (error) {
      console.error('Error fetching cats:', error)
      throw error
    }
  },

  // Get cats by user
  async getCatsByUser(userId) {
    try {
      const catsRef = collection(db, COLLECTIONS.CATS)
      const q = query(
        catsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const cats = []
      
      querySnapshot.forEach((doc) => {
        cats.push({ id: doc.id, ...doc.data() })
      })
      
      return cats
    } catch (error) {
      console.error('Error fetching user cats:', error)
      throw error
    }
  },

  // Create a new cat entry
  async createCat(catData) {
    try {
      const user = authService.getCurrentUser()
      
      // Prepare cat data
      const newCatData = {
        ...catData,
        userId: user?.uid || null,
        reporterType: user?.isAnonymous === false ? 'authenticated' : 'anonymous',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Remove any undefined values
      Object.keys(newCatData).forEach(key => {
        if (newCatData[key] === undefined) {
          delete newCatData[key]
        }
      })

      const catsRef = collection(db, COLLECTIONS.CATS)
      const docRef = await addDoc(catsRef, newCatData)
      
      // Get the created document to return it with the ID
      const createdDoc = await getDoc(docRef)
      return { id: createdDoc.id, ...createdDoc.data() }
    } catch (error) {
      console.error('Error creating cat:', error)
      throw error
    }
  },

  // Update a cat entry
  async updateCat(catId, updates) {
    try {
      const catRef = doc(db, COLLECTIONS.CATS, catId)
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      }

      await updateDoc(catRef, updateData)
      
      // Get the updated document
      const updatedDoc = await getDoc(catRef)
      return { id: updatedDoc.id, ...updatedDoc.data() }
    } catch (error) {
      console.error('Error updating cat:', error)
      throw error
    }
  },

  // Delete a cat entry
  async deleteCat(catId) {
    try {
      const catRef = doc(db, COLLECTIONS.CATS, catId)
      await deleteDoc(catRef)
      return true
    } catch (error) {
      console.error('Error deleting cat:', error)
      throw error
    }
  },

  // Upload cat photos to Firebase Storage
  async uploadCatPhotos(files, catId = null) {
    try {
      // Check if storage is available
      if (!storage) {
        throw new Error('Firebase Storage is not available on your current plan')
      }

      const uploadPromises = files.map(async (file, index) => {
        // Create a unique filename
        const timestamp = Date.now()
        const fileName = `${timestamp}_${index}_${file.name}`
        const filePath = catId
          ? `${STORAGE_PATHS.CAT_PHOTOS}/${catId}/${fileName}`
          : `${STORAGE_PATHS.CAT_PHOTOS}/temp/${fileName}`

        const storageRef = ref(storage, filePath)

        // Upload file
        const snapshot = await uploadBytes(storageRef, file)

        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref)

        return {
          url: downloadURL,
          path: filePath,
          name: fileName
        }
      })

      const uploadResults = await Promise.all(uploadPromises)
      return uploadResults
    } catch (error) {
      console.error('Error uploading cat photos:', error)

      // Provide a more helpful error message
      if (error.message.includes('Storage') || error.code === 'storage/unknown') {
        throw new Error('Photo upload is not available. Firebase Storage may not be enabled on your plan.')
      }

      throw error
    }
  },

  // Delete cat photos from Firebase Storage
  async deleteCatPhotos(photoPaths) {
    try {
      const deletePromises = photoPaths.map(async (path) => {
        const storageRef = ref(storage, path)
        await deleteObject(storageRef)
      })

      await Promise.all(deletePromises)
      return true
    } catch (error) {
      console.error('Error deleting cat photos:', error)
      throw error
    }
  },

  // Listen to real-time updates for cats
  onCatsSnapshot(callback, filters = {}) {
    try {
      const catsRef = collection(db, COLLECTIONS.CATS)
      let q = query(catsRef)

      // Apply filters
      if (filters.status) {
        q = query(q, where('status', '==', filters.status))
      }
      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId))
      }

      // Add ordering
      q = query(q, orderBy('createdAt', 'desc'))

      // Add limit for performance (default to 100 if not specified)
      const limitCount = filters.limit || 100
      q = query(q, limit(limitCount))

      return onSnapshot(q,
        (querySnapshot) => {
          const cats = []
          querySnapshot.forEach((doc) => {
            cats.push({ id: doc.id, ...doc.data() })
          })
          console.log('Firebase real-time update: received', cats.length, 'cats')
          callback(cats)
        },
        (error) => {
          console.error('Firebase real-time listener error:', error)
          // You could call an error callback here if needed
        }
      )
    } catch (error) {
      console.error('Error setting up cats snapshot listener:', error)
      throw error
    }
  },

  // Get a single cat by ID
  async getCatById(catId) {
    try {
      const catRef = doc(db, COLLECTIONS.CATS, catId)
      const catSnap = await getDoc(catRef)
      
      if (catSnap.exists()) {
        return { id: catSnap.id, ...catSnap.data() }
      } else {
        return null
      }
    } catch (error) {
      console.error('Error fetching cat by ID:', error)
      throw error
    }
  }
}
