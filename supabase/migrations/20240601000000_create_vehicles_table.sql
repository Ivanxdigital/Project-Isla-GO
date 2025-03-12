/*
  # Update Vehicles Table
  
  This migration enhances the existing vehicles table with additional fields and relationships.
*/

-- First, check if we need to rename the capacity column to seating_capacity
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicles' AND column_name = 'capacity'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicles' AND column_name = 'seating_capacity'
    ) THEN
        ALTER TABLE vehicles RENAME COLUMN capacity TO seating_capacity;
    END IF;
END $$;

-- Add missing columns to the vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS make text,
ADD COLUMN IF NOT EXISTS year integer,
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS vin_number text UNIQUE,
ADD COLUMN IF NOT EXISTS registration_number text,
ADD COLUMN IF NOT EXISTS registration_expiry date,
ADD COLUMN IF NOT EXISTS insurance_provider text,
ADD COLUMN IF NOT EXISTS insurance_policy_number text,
ADD COLUMN IF NOT EXISTS insurance_expiry date,
ADD COLUMN IF NOT EXISTS next_maintenance_date date,
ADD COLUMN IF NOT EXISTS maintenance_notes text,
ADD COLUMN IF NOT EXISTS purchase_date date,
ADD COLUMN IF NOT EXISTS purchase_price numeric,
ADD COLUMN IF NOT EXISTS current_mileage numeric,
ADD COLUMN IF NOT EXISTS fuel_type text,
ADD COLUMN IF NOT EXISTS vehicle_type text DEFAULT 'van',
ADD COLUMN IF NOT EXISTS photos jsonb,
ADD COLUMN IF NOT EXISTS documents jsonb;

-- Update existing records to set make field based on model
UPDATE vehicles
SET make = 'Toyota'
WHERE make IS NULL AND model LIKE '%HiAce%';

UPDATE vehicles
SET make = 'Nissan'
WHERE make IS NULL AND model LIKE '%Urvan%';

UPDATE vehicles
SET make = 'Hyundai'
WHERE make IS NULL AND model LIKE '%Starex%';

UPDATE vehicles
SET make = 'Unknown'
WHERE make IS NULL;

-- Set year to current year for existing records if null
UPDATE vehicles
SET year = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE year IS NULL;

-- Make required columns NOT NULL after ensuring they have values
ALTER TABLE vehicles 
ALTER COLUMN make SET NOT NULL,
ALTER COLUMN year SET NOT NULL;

-- Check if we need to modify the status type
DO $$
BEGIN
    -- If status is already using vehicle_status enum type, add 'reserved' if it doesn't exist
    IF EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'vehicle_status'
    ) THEN
        -- Check if 'reserved' value exists in the enum
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'vehicle_status' AND e.enumlabel = 'reserved'
        ) THEN
            -- Add 'reserved' to the enum
            ALTER TYPE vehicle_status ADD VALUE 'reserved';
        END IF;
        
        -- Check if 'out_of_service' value exists in the enum
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'vehicle_status' AND e.enumlabel = 'out_of_service'
        ) THEN
            -- Add 'out_of_service' to the enum if it doesn't exist
            -- Note: If 'inactive' exists, we might want to rename it instead
            IF EXISTS (
                SELECT 1 FROM pg_enum e
                JOIN pg_type t ON e.enumtypid = t.oid
                WHERE t.typname = 'vehicle_status' AND e.enumlabel = 'inactive'
            ) THEN
                -- We can't rename enum values in older PostgreSQL versions, so we'll handle this in the application code
                RAISE NOTICE 'Note: "inactive" status exists in vehicle_status enum. Consider treating it as equivalent to "out_of_service" in application code.';
            ELSE
                ALTER TYPE vehicle_status ADD VALUE 'out_of_service';
            END IF;
        END IF;
    END IF;
END $$;

-- Add constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'valid_seating_capacity'
    ) THEN
        ALTER TABLE vehicles
        ADD CONSTRAINT valid_seating_capacity 
        CHECK (seating_capacity > 0 AND seating_capacity <= 20);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'valid_year'
    ) THEN
        ALTER TABLE vehicles
        ADD CONSTRAINT valid_year
        CHECK (year >= 2000 AND year <= extract(year from now()) + 1);
    END IF;
END $$;

-- Add vehicle_id to drivers table if it doesn't exist
ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS vehicle_id uuid REFERENCES vehicles(id);

-- Create function to update the updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for vehicles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_vehicles_updated_at'
    ) THEN
        CREATE TRIGGER update_vehicles_updated_at
            BEFORE UPDATE ON vehicles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Create vehicle_assignments table for tracking history
CREATE TABLE IF NOT EXISTS vehicle_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) NOT NULL,
  driver_id uuid REFERENCES drivers(id) NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  unassigned_at timestamptz,
  assigned_by uuid REFERENCES auth.users(id),
  notes text,
  is_current boolean DEFAULT true
);

-- Create vehicle_maintenance_logs table
CREATE TABLE IF NOT EXISTS vehicle_maintenance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES vehicles(id) NOT NULL,
  maintenance_type text NOT NULL,
  maintenance_date date NOT NULL,
  mileage numeric,
  cost numeric,
  performed_by text,
  notes text,
  documents jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trigger for vehicle_maintenance_logs table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_vehicle_maintenance_logs_updated_at'
    ) THEN
        CREATE TRIGGER update_vehicle_maintenance_logs_updated_at
            BEFORE UPDATE ON vehicle_maintenance_logs
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable Row Level Security if not already enabled
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for vehicles if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'vehicles' AND policyname = 'Admin users can manage vehicles'
    ) THEN
        CREATE POLICY "Admin users can manage vehicles"
          ON vehicles
          USING (
            EXISTS (
              SELECT 1 FROM staff_roles
              WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
            )
          );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'vehicles' AND policyname = 'Drivers can view assigned vehicles'
    ) THEN
        CREATE POLICY "Drivers can view assigned vehicles"
          ON vehicles
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM drivers
              WHERE user_id = auth.uid() AND vehicle_id = vehicles.id
            )
          );
    END IF;
END $$;

-- Create policies for vehicle_assignments if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'vehicle_assignments' AND policyname = 'Admin users can manage vehicle assignments'
    ) THEN
        CREATE POLICY "Admin users can manage vehicle assignments"
          ON vehicle_assignments
          USING (
            EXISTS (
              SELECT 1 FROM staff_roles
              WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
            )
          );
    END IF;
END $$;

-- Create policies for vehicle_maintenance_logs if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'vehicle_maintenance_logs' AND policyname = 'Admin users can manage maintenance logs'
    ) THEN
        CREATE POLICY "Admin users can manage maintenance logs"
          ON vehicle_maintenance_logs
          USING (
            EXISTS (
              SELECT 1 FROM staff_roles
              WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
            )
          );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'vehicle_maintenance_logs' AND policyname = 'Drivers can view maintenance logs for their vehicles'
    ) THEN
        CREATE POLICY "Drivers can view maintenance logs for their vehicles"
          ON vehicle_maintenance_logs
          FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM drivers
              WHERE user_id = auth.uid() AND vehicle_id = vehicle_maintenance_logs.vehicle_id
            )
          );
    END IF;
END $$;

-- Create indexes for better performance if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'vehicles' AND indexname = 'idx_vehicles_status'
    ) THEN
        CREATE INDEX idx_vehicles_status ON vehicles(status);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'vehicles' AND indexname = 'idx_vehicles_make_model'
    ) THEN
        CREATE INDEX idx_vehicles_make_model ON vehicles(make, model);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'vehicle_assignments' AND indexname = 'idx_vehicle_assignments_vehicle_id'
    ) THEN
        CREATE INDEX idx_vehicle_assignments_vehicle_id ON vehicle_assignments(vehicle_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'vehicle_assignments' AND indexname = 'idx_vehicle_assignments_driver_id'
    ) THEN
        CREATE INDEX idx_vehicle_assignments_driver_id ON vehicle_assignments(driver_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'vehicle_assignments' AND indexname = 'idx_vehicle_assignments_is_current'
    ) THEN
        CREATE INDEX idx_vehicle_assignments_is_current ON vehicle_assignments(is_current);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'vehicle_maintenance_logs' AND indexname = 'idx_vehicle_maintenance_logs_vehicle_id'
    ) THEN
        CREATE INDEX idx_vehicle_maintenance_logs_vehicle_id ON vehicle_maintenance_logs(vehicle_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'vehicle_maintenance_logs' AND indexname = 'idx_vehicle_maintenance_logs_maintenance_date'
    ) THEN
        CREATE INDEX idx_vehicle_maintenance_logs_maintenance_date ON vehicle_maintenance_logs(maintenance_date);
    END IF;
END $$;

-- Add comments to tables
COMMENT ON TABLE vehicles IS 'Stores information about all vehicles in the fleet';
COMMENT ON TABLE vehicle_assignments IS 'Tracks the history of vehicle assignments to drivers';
COMMENT ON TABLE vehicle_maintenance_logs IS 'Records maintenance activities for vehicles'; 