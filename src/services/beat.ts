import { Beat, BeatAssignment } from '../types/database'
import { authService } from './auth'
import { supabase } from './supabase'

class BeatService {
  async getAssignedBeat(): Promise<{ beat?: Beat; assignment?: BeatAssignment; error?: string }> {
    try {
      const user = authService.getUser()
      if (!user) {
        return { error: 'User not authenticated' }
      }

      console.log('Fetching beat assignments for user:', user.email)

      // Get beat assignments from beat_personnel table
      const { data: assignments, error: assignmentError } = await supabase
        .from('beat_personnel')
        .select(`
          id,
          acceptance_status,
          assigned_at,
          beats (
            id,
            name,
            address,
            center_lat,
            center_lng,
            radius_meters,
            unit,
            sub_unit,
            beat_status,
            duty_start_time,
            duty_end_time,
            created_at
          )
        `)
        .eq('personnel_id', user.id)
        .limit(1)

      if (assignmentError) {
        console.log('Beat assignment fetch error:', assignmentError.message)
        return { error: assignmentError.message }
      }

      if (!assignments || assignments.length === 0) {
        return { error: 'No beat assigned to you' }
      }

      const assignmentData = assignments[0]
      const beatData = assignmentData.beats as any // Cast to handle nested object

      // Transform to our Beat interface
      const beat: Beat = {
        id: beatData.id,
        name: beatData.name,
        center_lat: beatData.center_lat,
        center_lng: beatData.center_lng,
        radius_meters: beatData.radius_meters || 1000,
        address: beatData.address || 'Beat location',
        unit: beatData.unit,
        sub_unit: beatData.sub_unit,
        beat_status: beatData.beat_status,
        duty_start_time: beatData.duty_start_time,
        duty_end_time: beatData.duty_end_time,
        created_at: beatData.created_at || assignmentData.assigned_at
      }

      // Transform to our BeatAssignment interface
      const assignment: BeatAssignment = {
        id: assignmentData.id,
        personnel_id: user.id,
        beat_id: beatData.id,
        assigned_date: new Date(assignmentData.assigned_at).toISOString().split('T')[0],
        start_time: beatData.duty_start_time,
        end_time: beatData.duty_end_time,
        status: assignmentData.acceptance_status || 'pending',
        accepted_at: assignmentData.acceptance_status === 'accepted' ? assignmentData.assigned_at : undefined,
        created_at: assignmentData.assigned_at,
        updated_at: assignmentData.assigned_at
      }

      console.log('Found beat assignment:', beat.name, 'Status:', assignment.status)
      return { beat, assignment }

    } catch (error) {
      console.error('Get assigned beat error:', error)
      return { error: 'Failed to fetch beat assignment' }
    }
  }

  async acceptBeat(assignmentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = authService.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      console.log('Accepting beat assignment:', assignmentId)

      // Update the acceptance_status in the beat_personnel table
      const { error } = await supabase
        .from('beat_personnel')
        .update({ 
          acceptance_status: 'accepted',
          // You might want to add an accepted_at timestamp field to the table
        })
        .eq('id', assignmentId)
        .eq('personnel_id', user.id)

      if (error) {
        console.error('Error accepting beat:', error.message)
        return { success: false, error: error.message }
      }

      console.log('Beat accepted successfully by:', user.full_name)
      return { success: true }
    } catch (error) {
      console.error('Accept beat error:', error)
      return { success: false, error: 'Failed to accept beat' }
    }
  }

  async updateStatus(status: 'on_duty' | 'off_duty' | 'break'): Promise<{ success: boolean; error?: string }> {
    try {
      const user = authService.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Since there's no status table, we'll log the status change
      // In a real app, you would create a personnel_status table
      console.log(`Status updated for ${user.full_name}: ${status}`)
      
      // You could add logic here to store status in a custom table
      
      return { success: true }
    } catch (error) {
      console.error('Update status error:', error)
      return { success: false, error: 'Failed to update status' }
    }
  }
}

export const beatService = new BeatService()
