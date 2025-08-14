import * as Location from 'expo-location'
import { authService } from './auth'
import { supabase } from './supabase'

class LocationService {
  private watchId: Location.LocationSubscription | null = null
  private isTracking = false

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync()
      
      if (foregroundStatus !== 'granted') {
        return false
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync()
      
      return backgroundStatus === 'granted'
    } catch (error) {
      console.error('Permission request error:', error)
      return false
    }
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.requestPermissions()
      if (!hasPermission) {
        throw new Error('Location permission not granted')
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      return location
    } catch (error) {
      console.error('Get current location error:', error)
      return null
    }
  }

  async startTracking(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions()
      if (!hasPermission) {
        return false
      }

      if (this.isTracking) {
        return true
      }

      // Start GPS tracking - Supabase Realtime will handle real-time updates automatically
      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,    // 5 seconds for good real-time performance
          distanceInterval: 5,   // 5 meters for reasonable sensitivity
        },
        (location) => {
          this.sendLocationUpdate(location)
        }
      )

      this.isTracking = true
      console.log('🚀 GPS tracking started with Supabase Realtime')
      return true
    } catch (error) {
      console.error('Start tracking error:', error)
      return false
    }
  }

  async stopTracking(): Promise<void> {
    try {
      if (this.watchId) {
        this.watchId.remove()
        this.watchId = null
      }
      this.isTracking = false
      console.log('🛑 GPS tracking stopped')
    } catch (error) {
      console.error('Stop tracking error:', error)
    }
  }

  private async sendLocationUpdate(location: Location.LocationObject): Promise<void> {
    try {
      const user = authService.getUser()
      if (!user) {
        console.warn('No authenticated user for location update')
        return
      }

      console.log('📍 Sending GPS to personnel_locations table...')
      console.log('User:', user.email)
      console.log('Location:', location.coords.latitude, location.coords.longitude)

      // First, try to check if record exists
      const { data: existingData } = await supabase
        .from('personnel_locations')
        .select('id')
        .eq('personnel_id', user.id)
        .single()

      if (existingData) {
        // Record exists, update it
        console.log('🔄 Updating existing record...')
        const { data, error } = await supabase
          .from('personnel_locations')
          .update({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 5,
            updated_at: new Date().toISOString()
          })
          .eq('personnel_id', user.id)
          .select()

        if (error) {
          console.error('❌ Update error:', error.message)
        } else {
          console.log('✅ GPS location updated successfully:', data[0])
          console.log('📡 Supabase Realtime will notify web dashboard automatically')
          console.log('🆔 Record ID:', data[0]?.id, 'Personnel ID:', data[0]?.personnel_id)
        }
      } else {
        // No record exists, insert new one
        console.log('🆕 Creating new record...')
        const { data, error } = await supabase
          .from('personnel_locations')
          .insert({
            personnel_id: user.id,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 5,
            updated_at: new Date().toISOString()
          })
          .select()

        if (error) {
          console.error('❌ Insert error:', error.message)
        } else {
          console.log('✅ New GPS record created:', data[0])
          console.log('📡 Supabase Realtime will notify web dashboard automatically')
          console.log('🆔 New Record ID:', data[0]?.id, 'Personnel ID:', data[0]?.personnel_id)
        }
      }

    } catch (error) {
      console.error('❌ GPS update error:', error)
    }
  }

  async endDuty(): Promise<void> {
    try {
      const user = authService.getUser()
      if (!user) {
        console.warn('No authenticated user for end duty')
        return
      }

      // Stop tracking first
      await this.stopTracking()

      console.log('🏁 Ending duty - clearing location data...')
      
      // Clear location data from database
      const { error } = await supabase
        .from('personnel_locations')
        .delete()
        .eq('personnel_id', user.id)

      if (error) {
        console.error('❌ Error clearing location data:', error.message)
        throw error
      }

      console.log('✅ Location data cleared on end duty')
      console.log('📡 Supabase Realtime will notify web dashboard of removal')

    } catch (error) {
      console.error('❌ End duty error:', error)
      throw error
    }
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking
  }

  // Clear personnel location data (for end duty)
  async clearPersonnelLocation(): Promise<void> {
    try {
      const user = authService.getUser()
      if (!user) {
        console.warn('No authenticated user for clearing location')
        return
      }

      const { error } = await supabase
        .from('personnel_locations')
        .delete()
        .eq('personnel_id', user.id)

      if (error) {
        console.error('❌ Error clearing location:', error.message)
        throw error
      }

      console.log('✅ Personnel location cleared')
    } catch (error) {
      console.error('❌ Clear location error:', error)
      throw error
    }
  }

  // Verify location data in database
  async verifyLocationData(): Promise<any> {
    try {
      const user = authService.getUser()
      if (!user) {
        console.warn('No authenticated user for verification')
        return null
      }

      const { data, error } = await supabase
        .from('personnel_locations')
        .select('*')
        .eq('personnel_id', user.id)
        .single()

      if (error) {
        console.log('❌ No location data found:', error.message)
        return null
      }

      console.log('✅ Current location data:', data)
      return data
    } catch (error) {
      console.error('❌ Verify location error:', error)
      return null
    }
  }
}

export const locationService = new LocationService()
