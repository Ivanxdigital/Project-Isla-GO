create table driver_notifications (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references bookings(id),
  driver_id uuid references drivers(id),
  status text not null default 'sent',
  sent_at timestamp with time zone default now(),
  response text,
  responded_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes for better query performance
create index idx_driver_notifications_booking_id on driver_notifications(booking_id);
create index idx_driver_notifications_driver_id on driver_notifications(driver_id);
create index idx_driver_notifications_status on driver_notifications(status); 