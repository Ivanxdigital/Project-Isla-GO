create table driver_notification_logs (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id),
  status_code int,
  response text,
  created_at timestamp with time zone default now()
);

-- Add new columns to bookings table
alter table bookings 
add column driver_notification_sent boolean default false,
add column driver_notification_sent_at timestamp with time zone,
add column driver_notification_attempted boolean default false,
add column driver_notification_attempted_at timestamp with time zone; 