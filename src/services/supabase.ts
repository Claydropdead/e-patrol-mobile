import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
  console.error('supabaseUrl:', process.env.EXPO_PUBLIC_SUPABASE_URL)
  console.error('supabaseAnonKey:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '[PRESENT]' : '[MISSING]')
  // Don't throw error to prevent app crash, will handle in auth service
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
