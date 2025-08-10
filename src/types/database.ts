export interface Personnel {
  id: string
  rank: string
  full_name: string
  email: string
  contact_number?: string
  province: string
  unit: string
  sub_unit: string
  is_active?: boolean
  created_at: string
  updated_at: string
}

export interface Beat {
  id: string
  name: string
  center_lat: number
  center_lng: number
  radius_meters: number
  address: string
  unit: string
  sub_unit: string
  beat_status: string
  duty_start_time: string
  duty_end_time: string
  created_at: string
}

export interface Location {
  id: string
  personnel_id: string
  latitude: number
  longitude: number
  accuracy?: number
  speed?: number
  heading?: number
  timestamp: string
  created_at: string
}

// Note: beat_assignments table doesn't exist yet, we'll need to create it
export interface BeatAssignment {
  id: string
  personnel_id: string
  beat_id: string
  assigned_date: string
  start_time: string
  end_time?: string
  status: 'pending' | 'accepted' | 'active' | 'completed'
  accepted_at?: string
  created_at: string
  updated_at: string
}

export interface AuthUser {
  id: string
  email: string
  rank: string
  full_name: string
  unit: string
  sub_unit: string
}
