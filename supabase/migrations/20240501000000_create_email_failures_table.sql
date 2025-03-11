-- Create email_failures table to track email sending issues
CREATE TABLE IF NOT EXISTS email_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id),
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS email_failures_booking_id_idx ON email_failures(booking_id);
CREATE INDEX IF NOT EXISTS email_failures_resolved_idx ON email_failures(resolved);
CREATE INDEX IF NOT EXISTS email_failures_created_at_idx ON email_failures(created_at);

-- Add comment to table
COMMENT ON TABLE email_failures IS 'Tracks failed email sending attempts for bookings'; 