/*
  # Initial Schema Setup for Palawan Express

  1. New Tables
    - `bookings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `from_location` (text)
      - `to_location` (text)
      - `departure_date` (timestamptz)
      - `return_date` (timestamptz, nullable)
      - `service_type` (text)
      - `passengers` (int)
      - `total_amount` (numeric)
      - `status` (text)
      - `created_at` (timestamptz)
    
    - `customers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `first_name` (text)
      - `last_name` (text)
      - `mobile_number` (text)
      - `messenger_type` (text)
      - `messenger_contact` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Read their own bookings and customer data
      - Create new bookings and customer data
*/

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
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
  user_id uuid REFERENCES auth.users NOT NULL,
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
CREATE POLICY "Users can view own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for customers
CREATE POLICY "Users can view own customer data"
  ON customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create customer data"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);