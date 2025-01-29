/*
  # Add time columns to bookings table
  
  1. Changes
    - Add departure_time column to bookings table
    - Add return_time column to bookings table
*/

DO $$ 
BEGIN
  -- Add departure_time column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'departure_time'
  ) THEN
    ALTER TABLE bookings ADD COLUMN departure_time text NOT NULL DEFAULT '12:00';
  END IF;

  -- Add return_time column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'return_time'
  ) THEN
    ALTER TABLE bookings ADD COLUMN return_time text;
  END IF;

  -- Remove the default constraint from departure_time after adding it
  ALTER TABLE bookings ALTER COLUMN departure_time DROP DEFAULT;
END $$;