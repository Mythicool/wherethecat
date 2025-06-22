import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if environment variables are properly configured
const isSupabaseConfigured = supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'your_supabase_project_url' &&
  supabaseAnonKey !== 'your_supabase_anon_key'

let supabaseClient

if (!isSupabaseConfigured) {
  console.error('❌ Supabase not configured properly!')
  console.error('Please follow these steps:')
  console.error('1. Create a Supabase project at https://supabase.com')
  console.error('2. Copy your project URL and anon key')
  console.error('3. Update the .env.local file with your actual credentials')
  console.error('4. Restart the development server')

  // Create a mock client for development without Supabase
  supabaseClient = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ error: new Error('Supabase not configured') }),
      signInWithPassword: () => Promise.resolve({ error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: new Error('Supabase not configured') })
    },
    from: () => ({
      select: () => ({ error: new Error('Supabase not configured') }),
      insert: () => ({ error: new Error('Supabase not configured') }),
      update: () => ({ error: new Error('Supabase not configured') }),
      delete: () => ({ error: new Error('Supabase not configured') })
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ error: new Error('Supabase not configured') }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) })
    })
  }
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = supabaseClient

// Database table names
export const TABLES = {
  CATS: 'cats',
  PROFILES: 'profiles'
}

// Storage bucket names
export const BUCKETS = {
  CAT_PHOTOS: 'cat-photos'
}
