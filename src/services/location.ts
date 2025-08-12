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

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 20000, // 20 seconds
          distanceInterval: 10, // 10 meters
        },
        (location) => {
          this.sendLocationUpdate(location)
        }
      )

      this.isTracking = true
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

      // Direct update to personnel_locations table
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
        console.error('❌ Database error:', error.message)
        
        // If no existing record, insert new one
        console.log('🔄 Trying to insert new record...')
        const { data: insertData, error: insertError } = await supabase
          .from('personnel_locations')
          .insert([{
            personnel_id: user.id,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 5,
            updated_at: new Date().toISOString()
          }])
          .select()

        if (insertError) {
          console.error('❌ Insert failed:', insertError.message)
        } else {
          console.log('✅ New GPS record created:', insertData)
        }
      } else {
        console.log('✅ GPS location updated successfully:', data)
      }

    } catch (error) {
      console.error('❌ GPS update error:', error)
    }
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking
  }
}

export const locationService = new LocationService()
