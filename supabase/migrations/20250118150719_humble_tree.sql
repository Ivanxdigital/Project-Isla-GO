-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,  -- Make user_id optional
  from_location text NOT NULL,
  to_location text NOT NULL,
  departure_date timestamptz NOT NULL,
  return_date timestamptz,
  service_type text NOT NULL,
  passengers int NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_locations CHECK (from_location != to_location),
  CONSTRAINT valid_passengers CHECK (passengers > 0 AND passengers <= 15)
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,  -- Make user_id optional
  first_name text NOT NULL,
  last_name text NOT NULL,
  mobile_number text NOT NULL,
  messenger_type text,
  messenger_contact text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policies for bookings
CREATE POLICY "Enable insert access for all users"
  ON bookings
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable select access for all users"
  ON bookings
  FOR SELECT
  TO public
  USING (true);

-- Policies for customers
CREATE POLICY "Enable insert access for all users"
  ON customers
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable select access for all users"
  ON customers
  FOR SELECT
  TO public
  USING (true);