/*
  # Add van model and seating capacity management
  
  1. Changes to drivers table:
    - Add van_model field
    - Add seating_capacity field
    - Add available_seats field for real-time tracking
  
  2. Changes to bookings table:
    - Add booked_seats field to track actual seats taken per booking
    - This is separate from group_size which represents the customer's party size
*/

-- Add van-related columns to drivers table
ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS van_model text,
ADD COLUMN IF NOT EXISTS seating_capacity integer,
ADD COLUMN IF NOT EXISTS available_seats integer;

-- Add constraint to ensure seating capacity is valid
ALTER TABLE drivers
ADD CONSTRAINT valid_seating_capacity 
CHECK (seating_capacity > 0 AND seating_capacity <= 15);

-- Add constraint to ensure available seats don't exceed capacity
ALTER TABLE drivers
ADD CONSTRAINT valid_available_seats 
CHECK (available_seats >= 0 AND available_seats <= seating_capacity);

-- Add booked_seats to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS booked_seats integer DEFAULT 1;

-- Add constraint to ensure booked seats is valid
ALTER TABLE bookings
ADD CONSTRAINT valid_booked_seats 
CHECK (booked_seats > 0 AND booked_seats <= 15);

-- Create function to update available seats
CREATE OR REPLACE FUNCTION update_driver_available_seats()
RETURNS TRIGGER AS $$
BEGIN
  -- When a booking is assigned to a driver
  IF (NEW.status = 'DRIVER_ASSIGNED' AND OLD.status != 'DRIVER_ASSIGNED') THEN
    -- For shared rides, use booked_seats
    -- For private rides, use full van capacity
    IF NEW.service_type = 'shared' THEN
      UPDATE drivers
      SET available_seats = seating_capacity - (
        SELECT COALESCE(SUM(booked_seats), 0)
        FROM bookings
        WHERE assigned_driver_id = NEW.assigned_driver_id
        AND status = 'DRIVER_ASSIGNED'
        AND departure_date = NEW.departure_date
        AND departure_time = NEW.departure_time
        AND service_type = 'shared'
      )
      WHERE id = NEW.assigned_driver_id;
    ELSE
      -- For private rides, mark all seats as booked for that time slot
      UPDATE drivers
      SET available_seats = 0
      WHERE id = NEW.assigned_driver_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating available seats
DROP TRIGGER IF EXISTS update_available_seats ON bookings;
CREATE TRIGGER update_available_seats
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_available_seats();

-- Function to initialize available seats
CREATE OR REPLACE FUNCTION initialize_available_seats()
RETURNS TRIGGER AS $$
BEGIN
  NEW.available_seats := NEW.seating_capacity;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set initial available seats when seating capacity is set
DROP TRIGGER IF EXISTS init_available_seats ON drivers;
CREATE TRIGGER init_available_seats
  BEFORE INSERT OR UPDATE OF seating_capacity ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION initialize_available_seats(); 