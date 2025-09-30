/*
  # Vehicle Service Booking System Schema

  ## Overview
  This migration creates the complete database schema for a vehicle service booking platform
  that allows users to book car/bike service appointments with real-time status tracking.

  ## New Tables

  ### 1. `profiles`
  User profile information linked to auth.users
  - `id` (uuid, primary key) - Links to auth.users
  - `full_name` (text) - User's full name
  - `phone` (text) - Contact phone number for SMS notifications
  - `email` (text) - Contact email
  - `created_at` (timestamptz) - Account creation timestamp

  ### 2. `vehicles`
  User's registered vehicles
  - `id` (uuid, primary key) - Unique vehicle identifier
  - `user_id` (uuid, foreign key) - Owner reference
  - `vehicle_type` (text) - 'car' or 'bike'
  - `make` (text) - Vehicle manufacturer
  - `model` (text) - Vehicle model name
  - `year` (integer) - Manufacturing year
  - `registration_number` (text) - License plate number
  - `created_at` (timestamptz) - Registration timestamp

  ### 3. `service_types`
  Available service categories
  - `id` (uuid, primary key) - Service type identifier
  - `name` (text) - Service name (e.g., "Oil Change", "Full Service")
  - `description` (text) - Detailed service description
  - `vehicle_type` (text) - Applicable to 'car', 'bike', or 'both'
  - `duration_minutes` (integer) - Estimated service duration
  - `price` (numeric) - Service cost
  - `active` (boolean) - Service availability status
  - `created_at` (timestamptz) - Creation timestamp

  ### 4. `time_slots`
  Available booking time slots
  - `id` (uuid, primary key) - Slot identifier
  - `date` (date) - Service date
  - `start_time` (time) - Slot start time
  - `end_time` (time) - Slot end time
  - `capacity` (integer) - Maximum concurrent bookings
  - `booked_count` (integer) - Current booking count
  - `active` (boolean) - Slot availability
  - `created_at` (timestamptz) - Creation timestamp

  ### 5. `bookings`
  Service booking records
  - `id` (uuid, primary key) - Booking identifier
  - `user_id` (uuid, foreign key) - Customer reference
  - `vehicle_id` (uuid, foreign key) - Vehicle reference
  - `service_type_id` (uuid, foreign key) - Service reference
  - `time_slot_id` (uuid, foreign key) - Time slot reference
  - `status` (text) - Current status: 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'
  - `notes` (text) - Customer notes/special requests
  - `created_at` (timestamptz) - Booking creation time
  - `updated_at` (timestamptz) - Last status update time

  ### 6. `booking_status_history`
  Status change tracking log
  - `id` (uuid, primary key) - History record identifier
  - `booking_id` (uuid, foreign key) - Related booking
  - `old_status` (text) - Previous status
  - `new_status` (text) - Updated status
  - `changed_by` (uuid) - User who made the change
  - `notes` (text) - Change reason/notes
  - `created_at` (timestamptz) - Change timestamp

  ## Security

  ### Row Level Security (RLS)
  All tables have RLS enabled with restrictive policies:

  #### Profiles
  - Users can view and update only their own profile
  - Users can create their profile upon registration

  #### Vehicles
  - Users can view, create, update, and delete only their own vehicles

  #### Service Types
  - All authenticated users can view active service types
  - Only service role can manage service types (handled via admin interface)

  #### Time Slots
  - All authenticated users can view available time slots
  - Only service role can manage time slots (handled via admin interface)

  #### Bookings
  - Users can view only their own bookings
  - Users can create bookings for their own vehicles
  - Users can update their own pending bookings
  - Service role can view and update all bookings

  #### Booking Status History
  - Users can view history for their own bookings
  - System automatically logs all status changes

  ## Important Notes

  1. **Data Integrity**: Foreign key constraints ensure referential integrity
  2. **Automatic Timestamps**: Uses triggers for updated_at fields
  3. **Default Values**: Sensible defaults for booleans and timestamps
  4. **Indexes**: Added for frequently queried columns (user_id, date, status)
  5. **Capacity Management**: Time slots track booking count to prevent overbooking
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('car', 'bike')),
  make text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL CHECK (year >= 1900 AND year <= 2100),
  registration_number text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);

-- Create service_types table
CREATE TABLE IF NOT EXISTS service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('car', 'bike', 'both')),
  duration_minutes integer NOT NULL DEFAULT 60,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active services"
  ON service_types FOR SELECT
  TO authenticated
  USING (active = true);

-- Create time_slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  capacity integer NOT NULL DEFAULT 3,
  booked_count integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_capacity CHECK (booked_count <= capacity)
);

ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view available slots"
  ON time_slots FOR SELECT
  TO authenticated
  USING (active = true AND date >= CURRENT_DATE);

CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(date);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles ON DELETE CASCADE,
  service_type_id uuid NOT NULL REFERENCES service_types ON DELETE RESTRICT,
  time_slot_id uuid NOT NULL REFERENCES time_slots ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_time_slot ON bookings(time_slot_id);

-- Create booking_status_history table
CREATE TABLE IF NOT EXISTS booking_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES auth.users,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view history for own bookings"
  ON booking_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_status_history.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_booking_history_booking_id ON booking_status_history(booking_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for bookings updated_at
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to log booking status changes
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by)
    VALUES (NEW.id, NULL, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for booking status logging
DROP TRIGGER IF EXISTS log_booking_status_changes ON bookings;
CREATE TRIGGER log_booking_status_changes
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_status_change();

-- Create function to update time slot booking count
CREATE OR REPLACE FUNCTION update_time_slot_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status NOT IN ('cancelled')) THEN
    UPDATE time_slots
    SET booked_count = booked_count + 1
    WHERE id = NEW.time_slot_id;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.status NOT IN ('cancelled') AND NEW.status = 'cancelled') THEN
      UPDATE time_slots
      SET booked_count = booked_count - 1
      WHERE id = NEW.time_slot_id;
    ELSIF (OLD.status = 'cancelled' AND NEW.status NOT IN ('cancelled')) THEN
      UPDATE time_slots
      SET booked_count = booked_count + 1
      WHERE id = NEW.time_slot_id;
    END IF;
  ELSIF (TG_OP = 'DELETE' AND OLD.status NOT IN ('cancelled')) THEN
    UPDATE time_slots
    SET booked_count = booked_count - 1
    WHERE id = OLD.time_slot_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for time slot count management
DROP TRIGGER IF EXISTS manage_time_slot_count ON bookings;
CREATE TRIGGER manage_time_slot_count
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_time_slot_count();

-- Insert sample service types
INSERT INTO service_types (name, description, vehicle_type, duration_minutes, price) VALUES
  ('Basic Service', 'Oil change, filter replacement, and basic inspection', 'both', 60, 49.99),
  ('Full Service', 'Comprehensive vehicle maintenance including fluids, filters, and inspection', 'both', 120, 129.99),
  ('Tire Service', 'Tire rotation, alignment, and pressure check', 'both', 45, 39.99),
  ('Brake Service', 'Brake pad inspection and replacement', 'both', 90, 99.99),
  ('Engine Diagnostic', 'Complete engine diagnostic and report', 'both', 60, 79.99),
  ('Detailing', 'Interior and exterior deep cleaning', 'both', 180, 149.99),
  ('Chain Maintenance', 'Chain cleaning, lubrication, and adjustment', 'bike', 30, 29.99),
  ('Battery Service', 'Battery check and replacement', 'both', 30, 69.99)
ON CONFLICT DO NOTHING;

-- Insert sample time slots for the next 7 days
DO $$
DECLARE
  slot_date date;
  slot_time time;
BEGIN
  FOR i IN 0..6 LOOP
    slot_date := CURRENT_DATE + i;
    
    FOR hour IN 9..17 BY 2 LOOP
      slot_time := (hour || ':00:00')::time;
      
      INSERT INTO time_slots (date, start_time, end_time, capacity, booked_count, active)
      VALUES (
        slot_date,
        slot_time,
        (slot_time + interval '2 hours')::time,
        3,
        0,
        true
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;