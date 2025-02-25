-- Add payment-related columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_session_id text UNIQUE,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add constraints and indexes
ALTER TABLE bookings
ADD CONSTRAINT valid_payment_status 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

CREATE INDEX IF NOT EXISTS idx_bookings_payment_session
ON bookings(payment_session_id);