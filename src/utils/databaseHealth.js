// Database health check utilities
import { supabase } from '../lib/supabase'

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  return url && key &&
         url !== 'your_supabase_project_url' &&
         key !== 'your_supabase_anon_key' &&
         url.includes('supabase.co')
}

/**
 * Test basic database connectivity
 */
export async function testDatabaseConnection() {
  try {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Supabase not configured',
        details: 'Environment variables are missing or invalid'
      }
    }

    // Try a simple query to test connectivity
    const { data, error } = await supabase
      .from('cats')
      .select('id')
      .limit(1)

    if (error) {
      return {
        success: false,
        error: 'Database query failed',
        details: error.message
      }
    }

    return {
      success: true,
      message: 'Database connection successful'
    }
  } catch (error) {
    return {
      success: false,
      error: 'Connection test failed',
      details: error.message
    }
  }
}

/**
 * Check if the database schema supports new features
 */
export async function checkDatabaseSchema() {
  try {
    const results = {
      basicSchema: false,
      reporterTypeSupport: false,
      profilesSupport: false,
      storageSupport: false
    }

    // Test basic cats table
    try {
      const { error: basicError } = await supabase
        .from('cats')
        .select('id, name, description, latitude, longitude, created_at')
        .limit(1)
      
      results.basicSchema = !basicError
    } catch (error) {
      console.log('Basic schema check failed:', error.message)
    }

    // Test reporter_type field
    try {
      const { error: reporterError } = await supabase
        .from('cats')
        .select('reporter_type')
        .limit(1)
      
      results.reporterTypeSupport = !reporterError
    } catch (error) {
      console.log('Reporter type field not available:', error.message)
    }

    // Test profiles table
    try {
      const { error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .limit(1)
      
      results.profilesSupport = !profilesError
    } catch (error) {
      console.log('Profiles table not available:', error.message)
    }

    // Test storage
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets()
      results.storageSupport = !storageError && buckets.some(bucket => bucket.name === 'cat-photos')
    } catch (error) {
      console.log('Storage not available:', error.message)
    }

    return results
  } catch (error) {
    console.error('Schema check failed:', error)
    return {
      basicSchema: false,
      reporterTypeSupport: false,
      profilesSupport: false,
      storageSupport: false,
      error: error.message
    }
  }
}

/**
 * Get database health status
 */
export async function getDatabaseHealth() {
  const health = {
    configured: isSupabaseConfigured(),
    connected: false,
    schema: null,
    timestamp: new Date().toISOString()
  }

  if (health.configured) {
    const connectionTest = await testDatabaseConnection()
    health.connected = connectionTest.success
    health.connectionError = connectionTest.error
    health.connectionDetails = connectionTest.details

    if (health.connected) {
      health.schema = await checkDatabaseSchema()
    }
  }

  return health
}

/**
 * Log database health information
 */
export async function logDatabaseHealth() {
  console.log('🔍 Checking database health...')
  
  const health = await getDatabaseHealth()
  
  console.log('📊 Database Health Report:')
  console.log('- Configured:', health.configured)
  console.log('- Connected:', health.connected)
  
  if (health.connectionError) {
    console.log('- Connection Error:', health.connectionError)
    console.log('- Details:', health.connectionDetails)
  }
  
  if (health.schema) {
    console.log('- Schema Support:')
    console.log('  - Basic Schema:', health.schema.basicSchema)
    console.log('  - Reporter Type:', health.schema.reporterTypeSupport)
    console.log('  - Profiles:', health.schema.profilesSupport)
    console.log('  - Storage:', health.schema.storageSupport)
  }
  
  return health
}

/**
 * Create demo data if database is not configured
 */
export function createDemoData() {
  return [
    {
      id: 'demo-1',
      name: 'Demo Cat 1',
      description: 'This is a demo cat to show how the app works. Configure Supabase to add real cats!',
      color: 'Orange/Ginger',
      size: 'Medium',
      latitude: 35.4676,
      longitude: -97.5164,
      date_spotted: '2024-01-15',
      created_at: new Date().toISOString(),
      status: 'active',
      photo_urls: [],
      user_id: null,
      reporter_type: 'demo'
    },
    {
      id: 'demo-2',
      name: 'Demo Cat 2',
      description: 'Another demo cat. Set up Supabase to start tracking real cats in your community!',
      color: 'Black',
      size: 'Small',
      latitude: 35.4700,
      longitude: -97.5200,
      date_spotted: '2024-01-14',
      created_at: new Date().toISOString(),
      status: 'active',
      photo_urls: [],
      user_id: null,
      reporter_type: 'demo'
    }
  ]
}

/**
 * Handle database errors gracefully
 */
export function handleDatabaseError(error, context = 'Database operation') {
  console.error(`${context} failed:`, error)
  
  // Common error patterns and user-friendly messages
  const errorPatterns = [
    {
      pattern: /column.*does not exist/i,
      message: 'Database schema needs to be updated. Please run the latest migrations.'
    },
    {
      pattern: /relation.*does not exist/i,
      message: 'Database table is missing. Please check your database setup.'
    },
    {
      pattern: /permission denied/i,
      message: 'Database permission error. Please check your access credentials.'
    },
    {
      pattern: /network/i,
      message: 'Network connection error. Please check your internet connection.'
    },
    {
      pattern: /timeout/i,
      message: 'Database request timed out. Please try again.'
    }
  ]
  
  for (const { pattern, message } of errorPatterns) {
    if (pattern.test(error.message)) {
      return {
        userMessage: message,
        technicalError: error.message,
        context
      }
    }
  }
  
  return {
    userMessage: 'An unexpected database error occurred. Please try again.',
    technicalError: error.message,
    context
  }
}
