import { supabase } from './supabase'
import { AuthUser } from '../types/database'
import * as SecureStore from 'expo-secure-store'

class AuthService {
  private authUser: AuthUser | null = null

  // Direct Supabase authentication
  async login(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      console.log('Attempting Supabase login for:', email)
      
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        console.log('Supabase auth error:', authError.message)
        return { success: false, error: authError.message }
      }

      if (!authData.user) {
        return { success: false, error: 'No user data returned' }
      }

      console.log('Auth successful, fetching personnel data...')

      // Get personnel data from database
      const { data: personnelData, error: personnelError } = await supabase
        .from('personnel')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (personnelError) {
        console.log('Personnel fetch error:', personnelError.message)
        return { success: false, error: 'Personnel record not found' }
      }

      // Create AuthUser object
      const authUser: AuthUser = {
        id: personnelData.id,
        email: personnelData.email,
        rank: personnelData.rank,
        full_name: personnelData.full_name,
        unit: personnelData.unit,
        sub_unit: personnelData.sub_unit
      }

      this.authUser = authUser

      // Store credentials securely
      await SecureStore.setItemAsync('userEmail', email)
      await SecureStore.setItemAsync('userId', authUser.id)
      
      console.log('Login successful for:', authUser.full_name)
      return { success: true, user: authUser }

    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An unexpected error occurred during login' }
    }
  }

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut()
      await SecureStore.deleteItemAsync('userEmail')
      await SecureStore.deleteItemAsync('userId')
      this.authUser = null
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (this.authUser) {
      return this.authUser
    }

    try {
      // Check if user is logged in with Supabase
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Get personnel data
        const { data: personnelData, error } = await supabase
          .from('personnel')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!error && personnelData) {
          this.authUser = {
            id: personnelData.id,
            email: personnelData.email,
            rank: personnelData.rank,
            full_name: personnelData.full_name,
            unit: personnelData.unit,
            sub_unit: personnelData.sub_unit
          }
          return this.authUser
        }
      }
    } catch (error) {
      console.error('Get current user error:', error)
    }

    return null
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      // Check if environment variables are missing
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase environment variables not configured, returning false for logged in status')
        return false
      }

      const { data: { user } } = await supabase.auth.getUser()
      return user !== null
    } catch (error) {
      console.error('Error checking login status:', error)
      return false
    }
  }

  getUser(): AuthUser | null {
    return this.authUser
  }
}

export const authService = new AuthService()
