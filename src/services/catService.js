import { supabase, TABLES, BUCKETS } from '../lib/supabase'

export const catService = {
  // Fetch all active cats
  async getAllCats() {
    const { data, error } = await supabase
      .from(TABLES.CATS)
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cats:', error)
      throw error
    }

    return data
  },

  // Fetch cats by user
  async getCatsByUser(userId) {
    const { data, error } = await supabase
      .from(TABLES.CATS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user cats:', error)
      throw error
    }

    return data
  },

  // Create a new cat entry
  async createCat(catData) {
    try {
      // Create a copy of catData to avoid modifying the original
      const dataToInsert = { ...catData }

      // Check if the database supports the reporter_type field
      // If not, remove it to maintain compatibility with older database schemas
      if (dataToInsert.reporter_type) {
        try {
          // Test if the reporter_type column exists by doing a simple select
          const { error: testError } = await supabase
            .from(TABLES.CATS)
            .select('reporter_type')
            .limit(1)

          // If the field doesn't exist, remove it from our data
          if (testError && (
            testError.message.includes('column "reporter_type" does not exist') ||
            testError.message.includes('does not exist')
          )) {
            console.log('Database does not support reporter_type field, removing from insert')
            delete dataToInsert.reporter_type
          }
        } catch (fieldCheckError) {
          // If we can't check the field, remove it to be safe
          console.log('Could not check reporter_type field, removing to be safe')
          delete dataToInsert.reporter_type
        }
      }

      const { data, error } = await supabase
        .from(TABLES.CATS)
        .insert([dataToInsert])
        .select()
        .single()

      if (error) {
        console.error('Error creating cat:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in createCat:', error)
      throw error
    }
  },

  // Update a cat entry
  async updateCat(catId, updates) {
    const { data, error } = await supabase
      .from(TABLES.CATS)
      .update(updates)
      .eq('id', catId)
      .select()
      .single()

    if (error) {
      console.error('Error updating cat:', error)
      throw error
    }

    return data
  },

  // Delete a cat entry
  async deleteCat(catId) {
    const { error } = await supabase
      .from(TABLES.CATS)
      .delete()
      .eq('id', catId)

    if (error) {
      console.error('Error deleting cat:', error)
      throw error
    }

    return true
  },

  // Upload cat photo
  async uploadPhoto(file, userId, catId) {
    const fileExt = file.name.split('.').pop()
    // Handle anonymous uploads with a special folder structure
    const userFolder = userId === 'anonymous' ? 'anonymous' : userId
    const fileName = `${userFolder}/${catId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from(BUCKETS.CAT_PHOTOS)
      .upload(fileName, file)

    if (error) {
      console.error('Error uploading photo:', error)
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKETS.CAT_PHOTOS)
      .getPublicUrl(fileName)

    return { path: data.path, publicUrl }
  },

  // Delete photo
  async deletePhoto(photoPath) {
    const { error } = await supabase.storage
      .from(BUCKETS.CAT_PHOTOS)
      .remove([photoPath])

    if (error) {
      console.error('Error deleting photo:', error)
      throw error
    }

    return true
  },

  // Search cats with filters
  async searchCats(filters = {}) {
    let query = supabase
      .from(TABLES.CATS)
      .select('*')
      .eq('status', 'active')

    // Apply filters
    if (filters.color) {
      query = query.eq('color', filters.color)
    }

    if (filters.size) {
      query = query.eq('size', filters.size)
    }

    if (filters.dateFrom) {
      query = query.gte('date_spotted', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('date_spotted', filters.dateTo)
    }

    if (filters.searchText) {
      query = query.or(`name.ilike.%${filters.searchText}%,description.ilike.%${filters.searchText}%`)
    }

    // Location-based search (within radius)
    if (filters.latitude && filters.longitude && filters.radius) {
      // This is a simplified distance calculation
      // For production, consider using PostGIS for more accurate geospatial queries
      const latRange = filters.radius / 111.32 // Rough conversion: 1 degree ≈ 111.32 km
      const lngRange = filters.radius / (111.32 * Math.cos(filters.latitude * Math.PI / 180))

      query = query
        .gte('latitude', filters.latitude - latRange)
        .lte('latitude', filters.latitude + latRange)
        .gte('longitude', filters.longitude - lngRange)
        .lte('longitude', filters.longitude + lngRange)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Error searching cats:', error)
      throw error
    }

    return data
  },

  // Subscribe to real-time changes
  subscribeToChanges(callback) {
    const subscription = supabase
      .channel('cats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.CATS,
          filter: 'status=eq.active'
        },
        callback
      )
      .subscribe()

    return subscription
  },

  // Export data
  async exportUserData(userId, format = 'json') {
    const cats = await this.getCatsByUser(userId)
    
    if (format === 'csv') {
      return this.convertToCSV(cats)
    }
    
    return JSON.stringify(cats, null, 2)
  },

  // Helper function to convert data to CSV
  convertToCSV(data) {
    if (!data.length) return ''

    const headers = [
      'id', 'name', 'description', 'color', 'size', 
      'latitude', 'longitude', 'date_spotted', 'status', 'created_at'
    ]

    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || ''
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        }).join(',')
      )
    ].join('\n')

    return csvContent
  }
}
