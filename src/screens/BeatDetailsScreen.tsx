import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Beat, BeatAssignment } from '../types/database'
import { beatService } from '../services/beat'
import { authService } from '../services/auth'

interface BeatDetailsScreenProps {
  onBeatAccepted: () => void
}

export const BeatDetailsScreen: React.FC<BeatDetailsScreenProps> = ({ onBeatAccepted }) => {
  const [beat, setBeat] = useState<Beat | null>(null)
  const [assignment, setAssignment] = useState<BeatAssignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const user = authService.getUser()

  const loadBeatData = async () => {
    try {
      const result = await beatService.getAssignedBeat()
      
      if (result.error) {
        Alert.alert('Error', result.error)
      } else {
        setBeat(result.beat || null)
        setAssignment(result.assignment || null)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load beat information')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const handleAcceptBeat = async () => {
    if (!assignment) {
      Alert.alert('Error', 'No beat assignment found')
      return
    }

    setIsAccepting(true)

    try {
      const result = await beatService.acceptBeat(assignment.id)
      
      if (result.success) {
        Alert.alert('Success', 'Beat accepted successfully!', [
          { text: 'OK', onPress: onBeatAccepted }
        ])
      } else {
        Alert.alert('Error', result.error || 'Failed to accept beat')
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred')
    } finally {
      setIsAccepting(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadBeatData()
  }

  useEffect(() => {
    loadBeatData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b'
      case 'accepted': return '#10b981'
      case 'active': return '#3b82f6'
      case 'completed': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Acceptance'
      case 'accepted': return 'Accepted'
      case 'active': return 'Active'
      case 'completed': return 'Completed'
      default: return status
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading beat information...</Text>
        </View>
      </View>
    )
  }

  if (!beat || !assignment) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScrollView
          contentContainerStyle={styles.centerContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={styles.noBeatTitle}>No Beat Assignment</Text>
          <Text style={styles.noBeatText}>
            You don't have any beat assignment at the moment.
          </Text>
          <Text style={styles.noBeatSubtext}>
            Pull down to refresh or contact your supervisor.
          </Text>
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Beat Assignment</Text>
          <Text style={styles.subtitle}>
            Welcome, {user?.rank} {user?.full_name}
          </Text>
        </View>

        {/* Beat Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Beat Information</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(assignment.status) }]}>
              <Text style={styles.statusText}>{getStatusText(assignment.status)}</Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Beat Name:</Text>
              <Text style={styles.infoValue}>{beat.name}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Unit:</Text>
              <Text style={styles.infoValue}>{beat.unit}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sub Unit:</Text>
              <Text style={styles.infoValue}>{beat.sub_unit}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{beat.address}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Assignment Date:</Text>
              <Text style={styles.infoValue}>
                {new Date(assignment.assigned_date).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Start Time:</Text>
              <Text style={styles.infoValue}>{assignment.start_time}</Text>
            </View>

            {assignment.end_time && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>End Time:</Text>
                <Text style={styles.infoValue}>{assignment.end_time}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Duty Time:</Text>
              <Text style={styles.infoValue}>
                {beat.duty_start_time} - {beat.duty_end_time}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={styles.infoValue}>{beat.beat_status}</Text>
            </View>
          </View>
        </View>

        {/* Personnel Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personnel Information</Text>
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Unit:</Text>
              <Text style={styles.infoValue}>{user?.unit}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sub Unit:</Text>
              <Text style={styles.infoValue}>{user?.sub_unit}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Position:</Text>
              <Text style={styles.infoValue}>{user?.rank}</Text>
            </View>
          </View>
        </View>

        {/* Accept Beat Button */}
        {assignment.status === 'pending' && (
          <TouchableOpacity
            style={[styles.acceptButton, isAccepting && styles.acceptButtonDisabled]}
            onPress={handleAcceptBeat}
            disabled={isAccepting}
          >
            <Text style={styles.acceptButtonText}>
              {isAccepting ? 'Accepting Beat...' : 'Accept Beat Assignment'}
            </Text>
          </TouchableOpacity>
        )}

        {assignment.status === 'accepted' && (
          <View style={styles.acceptedContainer}>
            <Text style={styles.acceptedText}>✅ Beat assignment accepted</Text>
            <Text style={styles.acceptedSubtext}>
              Ready to start location tracking
            </Text>
            <TouchableOpacity
              style={styles.proceedButton}
              onPress={onBeatAccepted}
            >
              <Text style={styles.proceedButtonText}>
                Start Location Tracking
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  descriptionContainer: {
    marginTop: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 4,
    lineHeight: 20,
  },
  acceptButton: {
    backgroundColor: '#10b981',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  acceptedContainer: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    padding: 20,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  acceptedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  acceptedSubtext: {
    fontSize: 14,
    color: '#047857',
    marginBottom: 16,
  },
  proceedButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  proceedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  noBeatTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  noBeatText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  noBeatSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
})
