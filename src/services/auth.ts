import { supabase } from './supabase'
import { AuthUser } from '../types/database'
import * as SecureStore from 'expo-secure-store'

class AuthService {
  private authUser: AuthUser | null = null

  // Test network connectivity to Supabase
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.getSession()
      
      if (error && error.message?.includes('fetch')) {
        return { success: false, error: 'Network connection failed' }
      }
      
      return { success: true }
    } catch (error) {
      if (error instanceof TypeError && error.message?.includes('fetch')) {
        return { success: false, error: 'Network request failed. Please check your internet connection.' }
      }
      return { success: false, error: 'Connection test failed' }
    }
  }

  // Direct Supabase authentication
  async login(email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    try {
      // Check network connectivity first
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
        return { success: false, error: 'Supabase configuration missing' }
      }

      // Test connection first
      const connectionTest = await this.testConnection()
      if (!connectionTest.success) {
        return { success: false, error: connectionTest.error || 'Network connection failed' }
      }

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        // Check for network-related errors
        if (authError.message?.includes('fetch') || authError.message?.includes('network')) {
          return { success: false, error: 'Network connection failed. Please check your internet connection and try again.' }
        }
        
        return { success: false, error: authError.message }
      }

      if (!authData.user) {
        return { success: false, error: 'No user data returned' }
      }

      // Get personnel data from database
      const { data: personnelData, error: personnelError } = await supabase
        .from('personnel')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (personnelError) {
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
      
      return { success: true, user: authUser }

    } catch (error) {
      // Handle network-specific errors
      if (error instanceof TypeError && error.message?.includes('fetch')) {
        return { success: false, error: 'Network request failed. Please check your internet connection.' }
      }
      
      if (error instanceof Error) {
        if (error.message?.includes('fetch') || error.message?.includes('network')) {
          return { success: false, error: 'Network connection failed. Please check your internet connection and try again.' }
        }
        return { success: false, error: error.message }
      }
      
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
        return false
      }

      const { data: { user } } = await supabase.auth.getUser()
      return user !== null
    } catch (error) {
      return false
    }
  }

  getUser(): AuthUser | null {
    return this.authUser
  }
}

export const authService = new AuthService()
