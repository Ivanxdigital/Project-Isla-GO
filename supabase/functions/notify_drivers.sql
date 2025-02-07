create function notify_drivers()
returns trigger
language plpgsql
security definer
as $$
declare
  response_status int;
  response_body text;
begin
  if (NEW.payment_status = 'paid' and OLD.payment_status != 'paid') then
    select
      status, content::text
    into
      response_status, response_body
    from
      net.http_post(
        'https://your-vercel-app.vercel.app/api/send-driver-sms',
        jsonb_build_object('bookingId', NEW.id),
        jsonb_build_object('Content-Type', 'application/json')
      );

    -- Log the response
    insert into driver_notification_logs (
      booking_id,
      status_code,
      response,
      created_at
    ) values (
      NEW.id,
      response_status,
      response_body,
      now()
    );

    -- Update booking with notification status
    update bookings
    set 
      driver_notification_attempted = true,
      driver_notification_attempted_at = now()
    where id = NEW.id;
  end if;
  return NEW;
end;
$$; 