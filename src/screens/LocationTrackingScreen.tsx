import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import * as Location from 'expo-location'
import { locationService } from '../services/location'
import { beatService } from '../services/beat'
import { authService } from '../services/auth'

interface LocationTrackingScreenProps {
  onLogout: () => void
}

export const LocationTrackingScreen: React.FC<LocationTrackingScreenProps> = ({ onLogout }) => {
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [dutyStatus, setDutyStatus] = useState<'off_duty' | 'on_duty' | 'break'>('off_duty')

  const user = authService.getUser()

  useEffect(() => {
    getCurrentLocation()
  }, [])

  const getCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation()
      if (location) {
        setCurrentLocation(location)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location')
    }
  }

  const handleStartDuty = async () => {
    try {
      // Update status to on_duty
      const statusResult = await beatService.updateStatus('on_duty')
      if (!statusResult.success) {
        Alert.alert('Error', statusResult.error || 'Failed to update status')
        return
      }

      // Start location tracking
      const trackingStarted = await locationService.startTracking()
      if (trackingStarted) {
        setIsTracking(true)
        setDutyStatus('on_duty')
        Alert.alert('Success', 'Location tracking started. You are now on duty.')
      } else {
        Alert.alert('Error', 'Failed to start location tracking')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start duty')
    }
  }

  const handleEndDuty = async () => {
    Alert.alert(
      'End Duty',
      'Are you sure you want to end your duty shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Duty',
          style: 'destructive',
          onPress: async () => {
            try {
              // Stop location tracking
              await locationService.stopTracking()
              
              // Update status to off_duty
              const statusResult = await beatService.updateStatus('off_duty')
              if (!statusResult.success) {
                Alert.alert('Warning', 'Status update failed, but tracking has stopped')
              }

              setIsTracking(false)
              setDutyStatus('off_duty')
              Alert.alert('Success', 'Duty ended. Location tracking stopped.')
            } catch (error) {
              Alert.alert('Error', 'Failed to end duty properly')
            }
          }
        }
      ]
    )
  }

  const handleTakeBreak = async () => {
    try {
      if (dutyStatus === 'break') {
        // Resume duty
        const statusResult = await beatService.updateStatus('on_duty')
        if (statusResult.success) {
          setDutyStatus('on_duty')
          Alert.alert('Success', 'Resumed duty')
        }
      } else {
        // Take break
        const statusResult = await beatService.updateStatus('break')
        if (statusResult.success) {
          setDutyStatus('break')
          Alert.alert('Success', 'Break started')
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update break status')
    }
  }

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will end your duty if active.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Stop tracking if active
              if (isTracking) {
                await locationService.stopTracking()
                await beatService.updateStatus('off_duty')
              }
              
              await authService.logout()
              onLogout() // Navigate back to login screen
            } catch (error) {
              Alert.alert('Error', 'Logout failed')
            }
          }
        }
      ]
    )
  }

  const getStatusColor = () => {
    switch (dutyStatus) {
      case 'on_duty': return '#10b981'
      case 'break': return '#f59e0b'
      case 'off_duty': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getStatusText = () => {
    switch (dutyStatus) {
      case 'on_duty': return 'On Duty'
      case 'break': return 'On Break'
      case 'off_duty': return 'Off Duty'
      default: return 'Unknown'
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Location Tracking</Text>
          <Text style={styles.subtitle}>
            {user?.rank} {user?.full_name}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
        {isTracking && (
          <View style={styles.trackingIndicator}>
            <Text style={styles.trackingText}>📍 Tracking Active</Text>
          </View>
        )}
      </View>

      {/* Location Display */}
      <ScrollView style={styles.locationSection}>
        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>📍 Current Location</Text>
          
          {currentLocation ? (
            <View style={styles.locationDetails}>
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Latitude:</Text>
                <Text style={styles.coordValue}>
                  {currentLocation.coords.latitude.toFixed(6)}
                </Text>
              </View>
              
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Longitude:</Text>
                <Text style={styles.coordValue}>
                  {currentLocation.coords.longitude.toFixed(6)}
                </Text>
              </View>
              
              {currentLocation.coords.accuracy && (
                <View style={styles.coordRow}>
                  <Text style={styles.coordLabel}>Accuracy:</Text>
                  <Text style={styles.coordValue}>
                    ±{currentLocation.coords.accuracy.toFixed(1)}m
                  </Text>
                </View>
              )}
              
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Last Updated:</Text>
                <Text style={styles.coordValue}>
                  {new Date(currentLocation.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noLocationContainer}>
              <Text style={styles.noLocationText}>
                Location not available
              </Text>
              <Text style={styles.noLocationSubtext}>
                Tap "Refresh Location" to get your current position
              </Text>
            </View>
          )}
        </View>
        
        {/* Location Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>🛡️ Patrol Instructions</Text>
          <Text style={styles.instructionsText}>
            • Start duty to begin location tracking{'\n'}
            • Your location will be shared with command center{'\n'}
            • Take breaks as needed during your shift{'\n'}
            • End duty when your shift is complete
          </Text>
        </View>
      </ScrollView>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        {dutyStatus === 'off_duty' ? (
          <TouchableOpacity style={styles.startDutyButton} onPress={handleStartDuty}>
            <Text style={styles.startDutyButtonText}>Start Duty</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeControls}>
            <TouchableOpacity 
              style={[
                styles.breakButton, 
                dutyStatus === 'break' && styles.resumeButton
              ]} 
              onPress={handleTakeBreak}
            >
              <Text style={styles.breakButtonText}>
                {dutyStatus === 'break' ? 'Resume Duty' : 'Take Break'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.endDutyButton} onPress={handleEndDuty}>
              <Text style={styles.endDutyButtonText}>End Duty</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.refreshLocationButton} onPress={getCurrentLocation}>
          <Text style={styles.refreshLocationButtonText}>📍 Refresh Location</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ef4444',
    borderRadius: 6,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  trackingIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
  },
  trackingText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '500',
  },
  map: {
    flex: 1,
  },
  locationSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  locationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  locationDetails: {
    marginTop: 8,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  coordLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  coordValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  noLocationContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noLocationText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  noLocationSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  instructionsCard: {
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d4ed8',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  controlPanel: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  startDutyButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  startDutyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  activeControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  breakButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  resumeButton: {
    backgroundColor: '#10b981',
  },
  breakButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  endDutyButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  endDutyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshLocationButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshLocationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
})
