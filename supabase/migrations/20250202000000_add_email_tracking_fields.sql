-- Add email tracking fields to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS confirmation_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_confirmation_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_confirmation_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS driver_assigned_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS driver_assigned_email_sent_at TIMESTAMPTZ;

-- Create index for faster queries on email status
CREATE INDEX IF NOT EXISTS idx_bookings_email_status ON bookings (
  confirmation_email_sent,
  payment_confirmation_email_sent,
  driver_assigned_email_sent
);

-- Add comment to explain the purpose of these fields
COMMENT ON COLUMN bookings.confirmation_email_sent IS 'Indicates if the initial booking confirmation email was sent';
COMMENT ON COLUMN bookings.confirmation_email_sent_at IS 'Timestamp when the initial booking confirmation email was sent';
COMMENT ON COLUMN bookings.payment_confirmation_email_sent IS 'Indicates if the payment confirmation email was sent';
COMMENT ON COLUMN bookings.payment_confirmation_email_sent_at IS 'Timestamp when the payment confirmation email was sent';
COMMENT ON COLUMN bookings.driver_assigned_email_sent IS 'Indicates if the driver assignment email was sent';
COMMENT ON COLUMN bookings.driver_assigned_email_sent_at IS 'Timestamp when the driver assignment email was sent'; 