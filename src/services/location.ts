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
          timeInterval: 30000, // 30 seconds
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

      const locationData = {
        personnel_id: user.id,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        speed: location.coords.speed,
        heading: location.coords.heading,
        timestamp: new Date(location.timestamp).toISOString(),
        created_at: new Date().toISOString()
      }

      // Note: Since 'locations' table doesn't exist, we'll create it or store elsewhere
      // For now, we'll just log the location data
      console.log('Location update:', {
        user: user.full_name,
        lat: location.coords.latitude.toFixed(6),
        lng: location.coords.longitude.toFixed(6),
        time: new Date().toLocaleTimeString()
      })

      // Uncomment this when locations table is created:
      /*
      const { error } = await supabase
        .from('locations')
        .insert([locationData])

      if (error) {
        console.error('Failed to save location:', error.message)
      }
      */

    } catch (error) {
      console.error('Send location update error:', error)
    }
  }

  isCurrentlyTracking(): boolean {
    return this.isTracking
  }
}

export const locationService = new LocationService()
