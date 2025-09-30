import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type VehicleType = 'car' | 'bike';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  vehicle_type: VehicleType;
  make: string;
  model: string;
  year: number;
  registration_number: string;
  created_at: string;
}

export interface ServiceType {
  id: string;
  name: string;
  description: string;
  vehicle_type: 'car' | 'bike' | 'both';
  duration_minutes: number;
  price: number;
  active: boolean;
  created_at: string;
}

export interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  active: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  vehicle_id: string;
  service_type_id: string;
  time_slot_id: string;
  status: BookingStatus;
  notes: string;
  created_at: string;
  updated_at: string;
  vehicle?: Vehicle;
  service_type?: ServiceType;
  time_slot?: TimeSlot;
}

export interface BookingStatusHistory {
  id: string;
  booking_id: string;
  old_status: BookingStatus | null;
  new_status: BookingStatus;
  changed_by: string;
  notes: string;
  created_at: string;
}