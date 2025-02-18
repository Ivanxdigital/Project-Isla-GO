--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.11 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: booking_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.booking_status AS ENUM (
    'pending',
    'paid',
    'finding_driver',
    'driver_assigned',
    'completed',
    'cancelled'
);


--
-- Name: driver_application_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.driver_application_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: driver_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.driver_status AS ENUM (
    'active',
    'inactive',
    'suspended'
);


--
-- Name: notification_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_status AS ENUM (
    'pending',
    'sent',
    'accepted',
    'declined',
    'expired'
);


--
-- Name: trip_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.trip_status AS ENUM (
    'pending',
    'confirmed',
    'ongoing',
    'completed',
    'cancelled'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'support'
);


--
-- Name: vehicle_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.vehicle_status AS ENUM (
    'active',
    'maintenance',
    'inactive'
);


--
-- Name: add_driver_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_driver_role() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Insert or update the staff role
        INSERT INTO staff_roles (user_id, role)
        VALUES (NEW.user_id, 'driver')
        ON CONFLICT (user_id) 
        DO UPDATE SET role = 'driver';
        
        -- Update user metadata
        UPDATE auth.users
        SET raw_user_meta_data = 
            COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object('role', 'driver')
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: add_staff_role_safe(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_staff_role_safe(user_uuid uuid, role_name text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  result JSONB;
BEGIN
  -- Delete any existing role for the user
  DELETE FROM staff_roles WHERE user_id = user_uuid;
  
  -- Insert new role
  INSERT INTO staff_roles (user_id, role)
  VALUES (user_uuid, role_name)
  RETURNING jsonb_build_object(
    'user_id', user_id,
    'role', role
  ) INTO result;
  
  RETURN result;
END;
$$;


--
-- Name: check_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_user_role(target_user_id uuid) RETURNS TABLE(user_has_access boolean, user_role text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (auth.uid() = target_user_id) as has_access,
    sr.role
  FROM staff_roles sr
  WHERE sr.user_id = target_user_id;
END;
$$;


--
-- Name: create_driver_notifications(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_driver_notifications(booking_id uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    booking_record RECORD;
    driver_record RECORD;
    notification_count INTEGER := 0;
    acceptance_code TEXT;
BEGIN
    -- Get booking details
    SELECT * INTO booking_record 
    FROM bookings 
    WHERE id = booking_id;

    -- Update booking status to finding_driver
    UPDATE bookings 
    SET status = 'finding_driver'
    WHERE id = booking_id;

    -- Find available drivers using our previous function
    FOR driver_record IN 
        SELECT DISTINCT driver_id 
        FROM find_available_drivers(
            booking_record.departure_date,
            booking_record.departure_time,
            booking_record.from_location,
            booking_record.to_location
        )
    LOOP
        -- Generate unique acceptance code for each driver
        acceptance_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
        
        -- Create notification record
        INSERT INTO driver_notifications (
            driver_id,
            booking_id,
            status,
            response_code,
            expires_at
        ) VALUES (
            driver_record.driver_id,
            booking_id,
            'pending'::notification_status,
            acceptance_code,
            NOW() + INTERVAL '30 minutes'
        );

        notification_count := notification_count + 1;
    END LOOP;

    -- Update booking with notification attempt
    UPDATE bookings 
    SET 
        driver_notification_attempted = TRUE,
        driver_notification_attempted_at = NOW()
    WHERE id = booking_id;

    RETURN notification_count;
END;
$$;


--
-- Name: debug_table_info(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.debug_table_info(table_name text) RETURNS TABLE(column_name text, data_type text)
    LANGUAGE plpgsql
    AS $$
begin
    return query
    select c.column_name::text, c.data_type::text
    from information_schema.columns c
    where c.table_name = debug_table_info.table_name
    and c.table_schema = 'public';
end;
$$;


--
-- Name: find_available_drivers(date, time without time zone, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.find_available_drivers(booking_date date, booking_time time without time zone, from_loc text, to_loc text) RETURNS TABLE(driver_id uuid, start_time time without time zone, end_time time without time zone, match_type text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    
    -- First, check specific date availability
    SELECT 
        da.driver_id,
        da.start_time,
        da.end_time,
        'specific_date'::TEXT as match_type
    FROM driver_availability da
    JOIN routes r ON da.route_id = r.id
    WHERE 
        da.date = booking_date
        AND da.status = 'available'
        AND booking_time BETWEEN da.start_time AND da.end_time
        AND r.from_location = from_loc
        AND r.to_location = to_loc
        
    UNION
    
    -- Then check recurring weekly availability
    SELECT 
        da.driver_id,
        da.start_time,
        da.end_time,
        'recurring'::TEXT as match_type
    FROM driver_availability da
    JOIN routes r ON da.route_id = r.id
    WHERE 
        da.day_of_week = EXTRACT(DOW FROM booking_date)::INTEGER
        AND da.status = 'available'
        AND booking_time BETWEEN da.start_time AND da.end_time
        AND r.from_location = from_loc
        AND r.to_location = to_loc
        -- Check if this date isn't in exceptions
        AND NOT EXISTS (
            SELECT 1 
            FROM unnest(da.exception_dates) ex_date 
            WHERE ex_date = booking_date
        )
    
    -- Order by specific dates first, then recurring
    ORDER BY match_type DESC;
    
END;
$$;


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(user_uuid uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    RETURN (
        SELECT role
        FROM staff_roles
        WHERE user_id = user_uuid
        LIMIT 1
    );
END;
$$;


--
-- Name: get_user_role_safe(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role_safe(user_uuid uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM staff_roles 
    WHERE user_id = user_uuid 
    LIMIT 1
  );
END;
$$;


--
-- Name: handle_driver_response(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_driver_response(p_booking_id uuid, p_driver_id uuid, p_response_code text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    notification_record RECORD;
    booking_record RECORD;
BEGIN
    -- Get notification record
    SELECT * INTO notification_record 
    FROM driver_notifications
    WHERE booking_id = p_booking_id 
    AND driver_id = p_driver_id
    AND response_code = p_response_code
    AND status = 'pending'::notification_status;

    -- Verify notification exists and hasn't expired
    IF notification_record IS NULL THEN
        RETURN 'INVALID_CODE';
    END IF;

    IF notification_record.expires_at < NOW() THEN
        RETURN 'EXPIRED';
    END IF;

    -- Get booking status
    SELECT status INTO booking_record 
    FROM bookings 
    WHERE id = p_booking_id;

    -- Check if booking is still available
    IF booking_record.status != 'finding_driver' THEN
        RETURN 'BOOKING_NO_LONGER_AVAILABLE';
    END IF;

    -- Update notification status
    UPDATE driver_notifications
    SET 
        status = 'accepted'::notification_status,
        response_time = NOW()
    WHERE id = notification_record.id;

    -- Update booking with assigned driver
    UPDATE bookings
    SET 
        status = 'driver_assigned',
        assigned_driver_id = p_driver_id,
        updated_at = NOW()
    WHERE id = p_booking_id;

    -- Mark other notifications for this booking as expired
    UPDATE driver_notifications
    SET status = 'expired'::notification_status
    WHERE booking_id = p_booking_id 
    AND id != notification_record.id;

    RETURN 'SUCCESS';
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;


--
-- Name: handle_paymongo_webhook(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_paymongo_webhook(payload jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  session_id TEXT;
  payment_status TEXT;
  booking_id UUID;
BEGIN
  -- Extract data from payload
  session_id := payload->'data'->'attributes'->'data'->>'id';
  payment_status := payload->'data'->'attributes'->'data'->'attributes'->>'payment_status';

  -- Map PayMongo status to our status
  IF payment_status = 'paid' THEN
    payment_status := 'completed';
  ELSIF payment_status IN ('failed', 'cancelled', 'expired') THEN
    payment_status := 'failed';
  ELSE
    payment_status := 'pending';
  END IF;

  -- Update payment record
  UPDATE payments
  SET 
    status = payment_status,
    updated_at = NOW()
  WHERE provider_session_id = session_id
  RETURNING booking_id INTO booking_id;

  -- Update booking status if payment record was found
  IF booking_id IS NOT NULL THEN
    UPDATE bookings
    SET 
      payment_status = payment_status,
      updated_at = NOW()
    WHERE id = booking_id;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'session_id', session_id,
    'payment_status', payment_status,
    'booking_id', booking_id
  );
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    new.updated_at = now();
    return new;
end;
$$;


--
-- Name: is_staff(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_staff() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'support')
  );
END;
$$;


--
-- Name: notify_drivers(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_drivers() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  request_id bigint;
  response_result net.http_response_result;
begin
  -- Set a shorter timeout for the entire function
  SET LOCAL statement_timeout = '30s';
  
  if (NEW.payment_status = 'paid' and OLD.payment_status != 'paid') then
    BEGIN
      -- Reduced HTTP timeout to 5 seconds
      SELECT net.http_post(
        url := 'https://your-production-domain.com/api/notify-driver',
        body := jsonb_build_object(
          'bookingId', NEW.id,
          'timestamp', extract(epoch from now())::text
        ),
        params := '{}'::jsonb,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'User-Agent', 'Supabase Function'
        ),
        timeout_milliseconds := 5000  -- 5 second timeout
      ) INTO request_id;

      -- Only wait 5 seconds for response
      SELECT * FROM net.http_collect_response(request_id, true) INTO response_result;

    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      insert into driver_notification_logs (
        booking_id,
        status_code,
        response,
        created_at
      ) values (
        NEW.id,
        500,
        format('{"error": "Timeout or connection error: %s"}', SQLERRM),
        now()
      );
      
      -- Update booking to show attempted but failed
      update bookings
      set 
        driver_notification_attempted = true,
        driver_notification_attempted_at = now(),
        driver_notification_success = false
      where id = NEW.id;
      
      -- Continue with the transaction
      return NEW;
    END;

    -- Only try to log response if we got one
    IF response_result.status_code IS NOT NULL THEN
      insert into driver_notification_logs (
        booking_id,
        status_code,
        response,
        created_at
      ) values (
        NEW.id,
        COALESCE(response_result.status_code, 500),
        COALESCE(response_result.response_body::text, 'No response received'),
        now()
      );

      -- Update booking status
      update bookings
      set 
        driver_notification_attempted = true,
        driver_notification_attempted_at = now(),
        driver_notification_success = (COALESCE(response_result.status_code, 500) = 200)
      where id = NEW.id;
    END IF;
  end if;
  return NEW;
end;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_access (
    user_id uuid NOT NULL,
    is_super_admin boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


--
-- Name: staff_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT staff_roles_new_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'support'::text]))),
    CONSTRAINT staff_roles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'support'::text, 'driver'::text])))
);


--
-- Name: admin_users; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.admin_users AS
 SELECT staff_roles.user_id
   FROM public.staff_roles
  WHERE (staff_roles.role = 'admin'::text)
  WITH NO DATA;


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    customer_id uuid,
    user_id uuid,
    from_location text NOT NULL,
    to_location text NOT NULL,
    departure_date date NOT NULL,
    departure_time time without time zone NOT NULL,
    return_date date,
    return_time time without time zone,
    service_type text NOT NULL,
    group_size integer NOT NULL,
    payment_method text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    payment_status text NOT NULL,
    status text NOT NULL,
    payment_session_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    pickup_option text DEFAULT 'airport'::text NOT NULL,
    hotel_pickup text,
    hotel_details jsonb,
    confirmation_email_sent boolean DEFAULT false,
    confirmation_email_sent_at timestamp with time zone,
    driver_assignment_email_sent boolean DEFAULT false,
    driver_assignment_email_sent_at timestamp with time zone,
    driver_notification_sent boolean DEFAULT false,
    driver_notification_sent_at timestamp with time zone,
    driver_notification_attempted boolean DEFAULT false,
    driver_notification_attempted_at timestamp with time zone,
    driver_notification_success boolean DEFAULT false,
    assigned_driver_id uuid,
    rating integer,
    CONSTRAINT bookings_rating_check CHECK (((rating >= 0) AND (rating <= 5)))
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    first_name text NOT NULL,
    last_name text NOT NULL,
    mobile_number text NOT NULL,
    messenger_type text NOT NULL,
    messenger_contact text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    email text,
    CONSTRAINT customers_email_check CHECK ((email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text))
);


--
-- Name: driver_application_drafts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.driver_application_drafts (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    form_data jsonb NOT NULL,
    current_step integer NOT NULL,
    last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: driver_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.driver_applications (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    driver_id uuid,
    full_name text NOT NULL,
    email text NOT NULL,
    mobile_number text NOT NULL,
    address text NOT NULL,
    license_number text NOT NULL,
    license_expiration date NOT NULL,
    license_type text NOT NULL,
    vehicle_make text NOT NULL,
    vehicle_model text NOT NULL,
    vehicle_year integer NOT NULL,
    plate_number text NOT NULL,
    or_cr_number text NOT NULL,
    vehicle_color text NOT NULL,
    insurance_provider text NOT NULL,
    policy_number text NOT NULL,
    policy_expiration date NOT NULL,
    tnvs_number text,
    cpc_number text,
    bank_name text NOT NULL,
    account_number text NOT NULL,
    account_holder text NOT NULL,
    driver_license_url text,
    or_cr_url text,
    insurance_url text,
    vehicle_front_url text,
    vehicle_side_url text,
    vehicle_rear_url text,
    nbi_clearance_url text,
    medical_certificate_url text,
    status public.driver_application_status DEFAULT 'pending'::public.driver_application_status,
    notes text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    documents jsonb,
    terms_accepted boolean DEFAULT false,
    privacy_accepted boolean DEFAULT false,
    CONSTRAINT driver_applications_license_type_check CHECK ((license_type = ANY (ARRAY['professional'::text, 'non-professional'::text])))
);


--
-- Name: driver_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.driver_assignments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    booking_id uuid,
    driver_id uuid,
    status text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT driver_assignments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'expired'::text])))
);


--
-- Name: driver_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.driver_availability (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    driver_id uuid,
    day_of_week integer NOT NULL,
    location text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    recurrence_rule text,
    exception_dates timestamp with time zone[],
    start_time time without time zone DEFAULT '00:00:00'::time without time zone NOT NULL,
    end_time time without time zone DEFAULT '23:59:59'::time without time zone NOT NULL,
    route_id uuid,
    status text DEFAULT 'available'::text NOT NULL,
    date date DEFAULT CURRENT_DATE,
    CONSTRAINT driver_availability_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6))),
    CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['available'::text, 'unavailable'::text, 'busy'::text]))),
    CONSTRAINT valid_times CHECK ((start_time < end_time))
);


--
-- Name: driver_notification_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.driver_notification_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    booking_id uuid,
    status_code integer,
    response text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: driver_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.driver_notifications (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    driver_id uuid,
    booking_id uuid,
    status text DEFAULT 'PENDING'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    acceptance_code text,
    expires_at timestamp with time zone,
    responded_at timestamp with time zone,
    response_code text,
    response_time timestamp with time zone,
    CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['PENDING'::text, 'ACCEPTED'::text, 'REJECTED'::text])))
);


--
-- Name: drivers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.drivers (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    license_number text NOT NULL,
    contact_number text NOT NULL,
    emergency_contact text,
    status public.driver_status DEFAULT 'active'::public.driver_status,
    documents_verified boolean DEFAULT false,
    license_expiry date NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    mobile_number text,
    service_types text[],
    current_location text,
    current_booking_id uuid,
    is_available boolean DEFAULT true,
    photo_url text,
    user_id uuid
);


--
-- Name: notification_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    driver_id uuid,
    trip_assignment_id uuid,
    notification_type text NOT NULL,
    message text NOT NULL,
    status text NOT NULL,
    twilio_message_id text,
    error_message text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid,
    amount numeric NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    provider text NOT NULL,
    provider_payment_id text,
    provider_session_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT payments_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT valid_status CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT auth.uid() NOT NULL,
    full_name text,
    mobile_number text,
    date_of_birth date,
    bio text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    role character varying(255) DEFAULT 'user'::character varying
);


--
-- Name: routes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.routes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    from_location text NOT NULL,
    to_location text NOT NULL,
    base_price numeric(10,2) NOT NULL,
    estimated_duration interval NOT NULL,
    status boolean DEFAULT true,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


--
-- Name: staff_roles_old; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_roles_old (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    role public.user_role NOT NULL,
    permissions jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


--
-- Name: trip_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trip_assignments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    booking_id uuid,
    vehicle_id uuid,
    driver_id uuid,
    departure_time timestamp with time zone NOT NULL,
    status public.trip_status DEFAULT 'pending'::public.trip_status,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    first_name text,
    last_name text,
    phone text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    role character varying(255) DEFAULT 'user'::character varying,
    CONSTRAINT valid_roles CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'driver'::character varying, 'admin'::character varying])::text[])))
);


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    plate_number text NOT NULL,
    model text NOT NULL,
    capacity integer NOT NULL,
    status public.vehicle_status DEFAULT 'active'::public.vehicle_status,
    last_maintenance_date timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);


--
-- Data for Name: admin_access; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_access (user_id, is_super_admin, created_at) FROM stdin;
681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	t	2025-01-26 11:10:25.712109+00
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bookings (id, customer_id, user_id, from_location, to_location, departure_date, departure_time, return_date, return_time, service_type, group_size, payment_method, total_amount, payment_status, status, payment_session_id, created_at, updated_at, pickup_option, hotel_pickup, hotel_details, confirmation_email_sent, confirmation_email_sent_at, driver_assignment_email_sent, driver_assignment_email_sent_at, driver_notification_sent, driver_notification_sent_at, driver_notification_attempted, driver_notification_attempted_at, driver_notification_success, assigned_driver_id, rating) FROM stdin;
66ac8039-384d-4a7d-8730-90881368b6fc	\N	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Test Origin	Test Destination	2025-02-08	14:00:00	\N	\N	STANDARD	1	CASH	500.00	PENDING	PENDING	\N	2025-02-08 14:29:55.113615+00	2025-02-08 14:29:55.113615+00	airport	\N	\N	f	\N	f	\N	f	\N	f	\N	f	\N	\N
83516cbf-46b1-41d6-ac5d-c5f823eef0df	\N	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Test Origin	Test Destination	2025-02-08	14:00:00	\N	\N	STANDARD	1	CASH	500.00	PENDING	DRIVER_ASSIGNED	\N	2025-02-08 15:18:00.970366+00	2025-02-08 15:18:00.970366+00	airport	\N	\N	f	\N	f	\N	f	\N	f	\N	f	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	\N
5b0a53a7-521b-4b9c-aebe-29eec45c8662	2e3b3618-6470-4259-8d9a-dd40eeab89bf	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-12	07:30:00	\N	\N	shared	1	online	850.00	paid	confirmed	cs_53KSUZpj9AVHj49Vu8i6nokz	2025-02-09 17:06:24.421896+00	2025-02-09 17:06:25.919+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-09 17:06:25.638001+00	f	\N	\N
a2a6378a-6c9f-4067-82b0-761f4a2c5635	ab37c399-b1d2-4524-9925-aa6fc1c01c2b	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-16	05:00:00	\N	\N	shared	1	online	700.00	pending	cancelled	\N	2025-02-15 07:20:41.471879+00	2025-02-15 07:36:15.406+00	airport	\N	\N	f	\N	f	\N	f	\N	f	\N	f	\N	\N
aaf066e2-8359-4fae-b9bd-d2f2bda250bf	43468b80-ee07-4b8a-8a47-97b8d4659896	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-16	05:00:00	\N	\N	shared	1	online	700.00	paid	confirmed	cs_sPBpsYfAHu3M7bRCkoLMjeKL	2025-02-15 14:17:15.702395+00	2025-02-15 14:17:17.682+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-15 14:17:17.54863+00	f	\N	\N
0c8d3a58-1d30-42ea-8661-8b656f0acefb	cf4ec926-5fb8-4e6f-b0eb-74768e801b67	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-16	05:00:00	\N	\N	shared	1	online	700.00	paid	confirmed	cs_3HoPcy8Z391WVM76MfHgMEoU	2025-02-15 07:46:08.856262+00	2025-02-15 07:46:09.907+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-15 07:46:09.838852+00	f	\N	\N
cf409525-9c04-46d4-bd06-7a7fb3c61c54	363823d0-cd2a-46a4-aa03-8d6766cf0b64	b4b35728-83c1-4798-a12d-bab245860290	Puerto Princesa	El Nido	2025-02-18	05:00:00	\N	\N	shared	1	online	700.00	paid	cancelled	cs_mDsTirBRs3MQrxi5WtzGJskG	2025-02-17 08:43:48.637047+00	2025-02-17 08:51:12.623+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-17 08:43:49.707514+00	f	\N	\N
194ad621-2664-481e-96de-d4f870e3b33d	3785cd29-2af7-40b8-bfe0-02e48b0d0cee	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-17	05:00:00	\N	\N	shared	1	online	700.00	paid	confirmed	cs_u5z2bd3HMekccrb3G23PMeC3	2025-02-15 09:16:37.360032+00	2025-02-15 09:19:47.32+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-15 09:16:38.310291+00	f	\N	\N
7e64ffa0-9669-402f-bdf5-da99e12582a9	3e5e6998-4de5-4fcb-9d89-c4ffa7d0d1df	b4b35728-83c1-4798-a12d-bab245860290	Puerto Princesa	El Nido	2025-02-19	10:30:00	\N	\N	shared	1	online	850.00	paid	confirmed	cs_oDy5fnnfRYGneDQFTFdocCc2	2025-02-18 04:27:28.35755+00	2025-02-18 04:27:29.735+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-18 04:27:29.517285+00	f	\N	\N
41c1749f-b989-4aaa-82a5-7bf6e98ad6be	\N	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Test Origin	Test Destination	2025-02-08	14:00:00	\N	\N	STANDARD	1	CASH	500.00	PENDING	DRIVER_ASSIGNED	\N	2025-02-08 14:31:28.422003+00	2025-02-08 14:31:28.422003+00	airport	\N	\N	f	\N	f	\N	f	\N	f	\N	f	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	\N
946efa49-eec5-435f-a50a-e670f35620a8	\N	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Test Origin	Test Destination	2025-02-08	14:00:00	\N	\N	STANDARD	1	CASH	500.00	PENDING	PENDING	\N	2025-02-08 15:21:06.245922+00	2025-02-08 15:21:06.245922+00	airport	\N	\N	f	\N	f	\N	f	\N	f	\N	f	\N	\N
a65db418-f32c-43f6-a767-a3ba0bfee1a8	a254f6af-5135-4005-acb8-a8de8a6e2ecf	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-14	07:30:00	\N	\N	shared	1	online	850.00	paid	confirmed	cs_Y7zrfCzVCewzZfAmQeBTpsWz	2025-02-12 09:44:33.420556+00	2025-02-12 09:44:35.223+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-12 09:44:35.04544+00	f	\N	\N
d02e336b-754d-4608-a18a-89134137c588	f3b2a97e-9110-4ab4-a175-5a88eb64aa13	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-17	05:00:00	\N	\N	shared	1	online	700.00	pending	cancelled	\N	2025-02-15 07:29:43.620983+00	2025-02-15 07:36:23.115+00	airport	\N	\N	f	\N	f	\N	f	\N	f	\N	f	\N	\N
90055c5a-c600-405f-b8dd-6ed476e09a78	d8a3ed8a-85db-4c03-95cb-a8c38b9880b0	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-17	05:00:00	\N	\N	shared	1	online	700.00	paid	confirmed	cs_YpaTHRt3LcRAKGBtNXDSxP6M	2025-02-15 14:22:06.906488+00	2025-02-15 14:22:08.017+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-15 14:22:08.045287+00	f	\N	\N
e2ea5776-3b00-4fae-8216-543bcab3ec28	872b5db6-8cd5-46e6-9c8e-15546f9008d7	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-16	05:00:00	\N	\N	shared	1	online	700.00	paid	confirmed	cs_mcP2ZMTbju91mKc5SJ8A75t6	2025-02-15 07:55:05.084759+00	2025-02-15 07:55:05.916+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-15 07:55:05.859372+00	f	\N	\N
a461ea26-92ec-47ab-8caf-a09770a23d3b	95eea074-2e0d-42b8-bf59-f8c341e8ee75	b4b35728-83c1-4798-a12d-bab245860290	Puerto Princesa	El Nido	2025-02-18	05:00:00	\N	\N	shared	1	online	700.00	paid	confirmed	cs_WFcE8NzpmQuKpmH4TeL2F6wF	2025-02-17 08:51:39.948653+00	2025-02-17 08:51:41.266+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-17 08:51:41.175243+00	f	\N	\N
4ba65572-e193-4c3c-9a0e-6c9b702d11e7	\N	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Test Origin	Test Destination	2025-02-08	14:00:00	\N	\N	STANDARD	1	CASH	500.00	PENDING	PENDING	\N	2025-02-08 14:32:39.714847+00	2025-02-08 14:32:39.714847+00	airport	\N	\N	f	\N	f	\N	f	\N	f	\N	f	\N	\N
fc932ff3-c48d-408f-b911-adf0f381fbef	\N	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Test Origin	Test Destination	2025-02-08	14:00:00	\N	\N	STANDARD	1	CASH	500.00	PENDING	PENDING	\N	2025-02-08 15:21:25.732081+00	2025-02-08 15:21:25.732081+00	airport	\N	\N	f	\N	f	\N	f	\N	f	\N	f	\N	\N
7528729e-1143-4ccb-9642-39e3b2374bc4	f453a08e-0222-4c53-9e49-90c11e91fe18	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-16	05:00:00	\N	\N	shared	1	online	700.00	paid	confirmed	cs_oGijVY8398VdRqQgsfjX5XJU	2025-02-15 14:25:48.227518+00	2025-02-15 14:25:49.394+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-15 14:25:49.425095+00	f	\N	\N
873f4858-e7a5-4690-a2ea-73876ed2b5ac	e59e45bb-6f0b-43e3-a882-08093ae6da19	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-17	05:00:00	\N	\N	shared	1	online	700.00	paid	cancelled	cs_P21Zv4xPvNeKFDdGdx8rkbkq	2025-02-15 07:31:56.389296+00	2025-02-15 07:36:19.339+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-15 07:31:57.675076+00	f	\N	\N
c2b54121-ded2-4ecd-9964-921cd4ada37e	17a78b2e-6f9a-436c-ba35-da1855dd12f2	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-21	05:00:00	\N	\N	shared	1	online	700.00	paid	cancelled	cs_rMXUnt7yoTVwNpmPayPz1tTT	2025-02-12 13:37:45.361238+00	2025-02-15 07:36:28.216+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-12 13:37:46.608617+00	f	\N	\N
dc44598e-d374-4780-861c-45650fd33705	611861dd-7e0a-479a-abfb-55fbcd097dce	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-16	07:30:00	\N	\N	shared	1	online	850.00	pending	pending	\N	2025-02-15 09:09:50.589704+00	2025-02-15 09:09:50.589704+00	airport	\N	\N	f	\N	f	\N	f	\N	f	\N	f	\N	\N
ab527529-7f54-4b54-bd72-8b4a6066e2c1	08c8d72a-c2bd-4375-b7da-3babe1bd3e46	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-19	05:00:00	\N	\N	shared	1	online	700.00	paid	confirmed	cs_Q6VaHYpCXFpVgWCZqCyRhDTJ	2025-02-17 10:40:14.254425+00	2025-02-17 10:40:15.32+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-17 10:40:15.394025+00	f	\N	\N
76c2ca48-49e2-4da1-a182-1e450a537947	\N	\N	Airport	El Nido	2024-03-20	09:00:00	\N	\N	private15	4	online	5000.00	paid	cancelled	\N	2025-02-07 03:48:00.988043+00	2025-02-08 06:39:59.193+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-07 06:06:20.873362+00	f	\N	\N
9b2d2a91-e8ef-4f64-a313-a025a7c9def7	\N	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Test Origin	Test Destination	2025-02-08	14:00:00	\N	\N	STANDARD	1	CASH	500.00	PENDING	DRIVER_ASSIGNED	\N	2025-02-08 15:12:07.784632+00	2025-02-08 15:12:07.784632+00	airport	\N	\N	f	\N	f	\N	f	\N	f	\N	f	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	\N
86cf057f-d55a-4551-9f43-3e0996548388	db3c3395-0873-4791-9024-e6de7778d5a2	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-11	10:30:00	\N	\N	shared	1	online	850.00	paid	confirmed	cs_3E3zf2ffRcExAvMNEbEuBuib	2025-02-09 16:56:42.906814+00	2025-02-09 16:56:44.365+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-09 16:56:44.058955+00	f	\N	\N
b91f364e-5254-4010-950b-4f79eb828338	71e6ca09-71b6-4e4d-8427-cc7fed2217fa	b4b35728-83c1-4798-a12d-bab245860290	Puerto Princesa	El Nido	2025-02-18	07:30:00	\N	\N	shared	1	online	850.00	paid	confirmed	cs_8tkazZSacZS2V5eDNqXiickh	2025-02-17 06:48:41.631492+00	2025-02-17 06:48:43.365+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-17 06:48:43.299846+00	f	\N	\N
2d1992e8-4bdc-4f9b-abe0-805022dc7940	bd5a6a4f-3364-4d88-a22d-8f0271ff5469	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-13	07:30:00	\N	\N	shared	1	online	850.00	paid	confirmed	cs_t3pr7UsTgHLS6RsY9M25xQmv	2025-02-12 13:43:30.650268+00	2025-02-12 13:43:32.289+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-12 13:43:32.016906+00	f	\N	\N
4bee6e39-f5b4-4406-bd98-f5aef3783885	9fbba318-2100-453c-b84a-22f5c832e7e5	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-08	07:30:00	\N	\N	shared	1	online	850.00	paid	confirmed	cs_GtguBZwsHKoMGLFrQdBLbmpb	2025-02-07 09:52:36.782135+00	2025-02-07 09:52:41.013+00	hotel	Palawan Uno Hotel	{"name": "Palawan Uno Hotel", "address": "National Highway, Puerto Princesa, 5300 Palawan, Philippines", "location": {"lat": 9.755035399999999, "lng": 118.7471588}}	f	\N	f	\N	f	\N	t	2025-02-07 09:52:37.962257+00	f	\N	\N
d6377162-7832-4230-b42c-349eb38d0737	4e9765b2-e90c-416a-b79c-fac7955f8085	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-17	07:30:00	\N	\N	shared	1	online	850.00	paid	confirmed	cs_nFdiW1zddzWmEsUvjhR17ejB	2025-02-15 07:37:22.256212+00	2025-02-15 07:37:23.546+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-15 07:37:23.41881+00	f	\N	\N
c1b407a0-7b8b-48e7-b453-f05c15a2791c	2b037915-cb22-4eb7-b622-226507769e1d	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-08	05:00:00	\N	\N	shared	1	online	700.00	paid	confirmed	cs_26kQFWnnRyCw6N7Uk2UFHhDo	2025-02-07 15:20:17.058458+00	2025-02-07 15:20:18.89+00	hotel	Palawan Uno Hotel	{"name": "Palawan Uno Hotel", "address": "National Highway, Puerto Princesa, 5300 Palawan, Philippines", "location": {"lat": 9.755035399999999, "lng": 118.7471588}}	f	\N	f	\N	t	2025-02-07 15:20:55.541+00	t	2025-02-07 15:20:18.644821+00	f	\N	\N
325773ec-99c7-4779-b586-623e78d77deb	10fdc41a-8811-424a-8131-4fecddb7decc	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-08	07:30:00	\N	\N	shared	1	online	850.00	paid	confirmed	cs_dvgsEvNtaLNLu5rrAgMqJYqy	2025-02-07 09:56:31.172021+00	2025-02-07 09:57:05.983+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-07 09:57:03.645518+00	f	\N	\N
6022c8f1-f495-4ac1-8d4c-189cd9a408f1	f2cb4b99-b714-4594-bf9d-056189de604a	b4b35728-83c1-4798-a12d-bab245860290	Puerto Princesa	El Nido	2025-02-19	05:00:00	\N	\N	shared	1	online	700.00	paid	confirmed	cs_5ej9g7g7zMvSMDpe1bLZtKa6	2025-02-17 12:06:50.933579+00	2025-02-17 12:06:52.114+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-17 12:06:52.134113+00	f	\N	\N
d192afc2-5c35-48f4-afb8-ec18fb0b338a	ecf16a6d-dffb-42e1-9f22-6e62b8f8c7f1	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Puerto Princesa	El Nido	2025-02-16	07:30:00	\N	\N	shared	1	online	850.00	paid	confirmed	cs_YUZP8tqVEkniQuFbsNtHhkeE	2025-02-15 09:12:39.39595+00	2025-02-15 09:19:47.317+00	airport	\N	\N	f	\N	f	\N	f	\N	t	2025-02-15 09:12:40.775819+00	f	\N	\N
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, user_id, first_name, last_name, mobile_number, messenger_type, messenger_contact, created_at, updated_at, email) FROM stdin;
d467596f-553b-48c0-9578-5320199b3258	50336b54-d231-46b8-ad34-8814fc3a3558	Ham	Jam	+639993702550	whatsapp		2025-01-22 13:55:47.96221+00	2025-01-22 13:55:47.96221+00	\N
3e17869c-341e-4229-a06b-f20d797aa9b1	50336b54-d231-46b8-ad34-8814fc3a3558	Ham	Jam	+639993702550	whatsapp		2025-01-22 13:56:21.621486+00	2025-01-22 13:56:21.621486+00	\N
7cb4f07f-624a-4eea-87b1-a0c5a7ff7f83	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-01-22 14:01:41.119279+00	2025-01-22 14:01:41.119279+00	\N
851e147e-6413-475b-98b5-ce75c195b784	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ham	Ware	+639993702550	whatsapp		2025-01-22 14:04:53.75922+00	2025-01-22 14:04:53.75922+00	\N
a74b3216-7c7b-4909-be33-fe73c8835915	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ham	Hmm	+639993702550	whatsapp		2025-01-22 14:10:06.5926+00	2025-01-22 14:10:06.5926+00	\N
daa350cc-019a-4ff7-a165-1685eb3bac59	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ham	Jee	+639993702550	whatsapp		2025-01-22 14:11:14.637217+00	2025-01-22 14:11:14.637217+00	\N
372b4573-380d-4aa0-b10f-a5cb2e53924c	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Jam	+639993702550	whatsapp		2025-01-22 14:15:27.496458+00	2025-01-22 14:15:27.496458+00	\N
6f6d9308-a41c-4ff5-8af7-ac48ba2549ae	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Vhris	Mare	+639993702550	whatsapp		2025-01-22 14:41:39.327559+00	2025-01-22 14:41:39.327559+00	\N
11c13dee-493c-442c-83fc-abb7e958b7b8	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	James	+639993702550	whatsapp		2025-01-23 03:28:32.414152+00	2025-01-23 03:28:32.414152+00	\N
8abaf766-d371-46bb-a50b-22c7de307161	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	asd	asdasd	+639023849082349	whatsapp		2025-01-23 03:38:50.734319+00	2025-01-23 03:38:50.734319+00	\N
b4edeee2-7b1b-4b32-bee6-6848855c28f0	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	asdjahs	jsadkjas	+63839823473489	whatsapp		2025-01-23 03:45:52.322963+00	2025-01-23 03:45:52.322963+00	\N
7b2cba08-715e-441e-89ea-e57c05223f51	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	asdjsaj	kjasdjas	+63932894328	whatsapp		2025-01-23 03:52:26.833387+00	2025-01-23 03:52:26.833387+00	\N
d2244f9b-fa06-407a-bbff-4c6ec40f86c2	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	jsakjsh	sjahkjasdh	+633289984379834	whatsapp		2025-01-23 08:14:05.558875+00	2025-01-23 08:14:05.558875+00	\N
31345fed-37e1-4b08-b716-75159fef53d0	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	jhasdh	sajhdjhs	+63999384898	whatsapp		2025-01-23 08:23:09.466607+00	2025-01-23 08:23:09.466607+00	\N
6e0681d1-ee22-45d4-b998-e8a52b9c35cc	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	sjahsdj	jdshsdjsh	+63932849238	whatsapp		2025-01-23 08:31:52.687257+00	2025-01-23 08:31:52.687257+00	\N
1f948566-2388-4086-8656-92282a4cf8c7	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	sakjdahsj	dsjdjshdsjk	+6339828249383	whatsapp		2025-01-23 08:43:28.064202+00	2025-01-23 08:43:28.064202+00	\N
f582cba5-51c2-41a1-98b2-e8a399a9aaeb	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	dasjasjh	dsjdakjhsj	+639993702550	whatsapp		2025-01-23 08:56:37.108484+00	2025-01-23 08:56:37.108484+00	\N
e2ecace9-6dbe-42a6-8d70-00b154563eea	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	asjdhakshd	sdjakjdhsa	+639209489233	whatsapp		2025-01-23 09:02:01.799199+00	2025-01-23 09:02:01.799199+00	\N
8e6d013d-ad47-4354-be82-6d036424b927	b4b35728-83c1-4798-a12d-bab245860290	Ivan	Infante	+639993702550	whatsapp		2025-01-23 09:56:26.854623+00	2025-01-23 09:56:26.854623+00	\N
5bc110fd-4335-483e-8525-1b5227f6dd29	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Man	+639993702550	whatsapp		2025-01-23 13:56:27.947885+00	2025-01-23 13:56:27.947885+00	\N
68c4057c-f212-4206-9ab2-b468b0bca0d7	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Mao	JKs	+639320902343	whatsapp		2025-01-23 14:15:56.665217+00	2025-01-23 14:15:56.665217+00	\N
abcbe2cc-3ddb-4638-b64e-3319e7523232	d8161159-c906-412e-8e49-92bae0131f7c	Hsus	Gshshsh	+639673105546	whatsapp		2025-01-23 15:05:28.718891+00	2025-01-23 15:05:28.718891+00	\N
47e4842e-86d0-4894-a54b-e2b057264370	9ed86db7-3338-49c4-8e79-2a2ddbe57f0b	James	Man	+639993209834	whatsapp		2025-01-23 15:10:08.212925+00	2025-01-23 15:10:08.212925+00	\N
b56cec24-d180-4308-9695-e7a79a7b4f19	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Arthur	+639392438493	whatsapp		2025-01-23 15:17:11.26226+00	2025-01-23 15:17:11.26226+00	\N
75f5b683-e2d4-4756-bc97-5ac61ec01b34	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Mannie	+633848247723	whatsapp		2025-01-23 16:01:18.671075+00	2025-01-23 16:01:18.671075+00	\N
481e7f09-3aa8-484e-a54a-e716c7ee6ad2	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	jsajdkasdj	jdskjsdahds	+63999389282	whatsapp		2025-01-24 03:41:47.335323+00	2025-01-24 03:41:47.335323+00	\N
11c59bb2-a529-4951-8a4b-4f03886b73f9	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Man	+63982812183729	whatsapp		2025-01-24 05:29:23.492689+00	2025-01-24 05:29:23.492689+00	\N
48e15bcc-2018-49bd-bf13-d280f78e8002	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Mann	+639993702550	whatsapp		2025-01-24 07:02:51.577005+00	2025-01-24 07:02:51.577005+00	\N
64175c46-690b-4902-8c6b-89176659987b	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Mann	+639993702550	whatsapp		2025-01-24 07:13:32.712076+00	2025-01-24 07:13:32.712076+00	\N
4757333c-4cc1-4f9d-b43f-3a6eaae97178	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Haha	+6382791298329	whatsapp		2025-01-24 10:28:40.376921+00	2025-01-24 10:28:40.376921+00	\N
6671bc0d-6bf9-4b1d-b0f9-c1666365f984	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Mogley	+639993702550	whatsapp		2025-01-24 13:38:02.384956+00	2025-01-24 13:38:02.384956+00	\N
acf5eca2-1e7d-4d25-8ba4-a6342958b172	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Harden	+639993702550	whatsapp		2025-01-24 13:54:38.050235+00	2025-01-24 13:54:38.050235+00	\N
c03d3a35-638e-4933-9917-59223a96b3e0	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ham	Ham	+6399209283	whatsapp		2025-01-24 14:09:43.411897+00	2025-01-24 14:09:43.411897+00	\N
0ed57ed2-af90-4e52-a133-5d3fa0671ed2	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Haama	Jhhs	+6312312312321	whatsapp		2025-01-24 15:12:36.287944+00	2025-01-24 15:12:36.287944+00	\N
a4f636de-d83e-49ce-925a-61bdafb18c48	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Mayhem	+639993702550	whatsapp		2025-01-25 07:53:44.372628+00	2025-01-25 07:53:44.372628+00	\N
88f90630-674f-4ef9-873a-4343e8451482	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Man	+639993702559	whatsapp		2025-01-25 08:27:55.343411+00	2025-01-25 08:27:55.343411+00	\N
c92374b4-d119-45ef-9f2f-3a12c5466026	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Man	+639993702550	whatsapp		2025-01-25 08:58:00.212006+00	2025-01-25 08:58:00.212006+00	\N
d2aa3618-20b6-4232-a7c7-8d99d4aba90d	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Maha	+639993702550	whatsapp		2025-01-25 09:03:42.446365+00	2025-01-25 09:03:42.446365+00	\N
c5cc0558-ac66-41e1-9aa1-993bf66de0c6	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Mohon	+639993702550	whatsapp		2025-01-25 09:10:54.241771+00	2025-01-25 09:10:54.241771+00	\N
013d8f1e-8465-4733-8a48-481bff783b2f	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Mann	+639993702550	whatsapp		2025-01-25 09:21:02.311137+00	2025-01-25 09:21:02.311137+00	\N
3ad2eec9-a5ce-4bf9-a0c8-95d2d365be2c	7f87032e-df48-4715-9244-9dd8f2e04273	Corinne	Bustos	+639673102560	whatsapp		2025-01-25 15:01:21.2524+00	2025-01-25 15:01:21.2524+00	\N
59a96182-30f1-48cd-8670-4d688ea3b522	7f87032e-df48-4715-9244-9dd8f2e04273	Gahjshd	Gshjshd	+639673102560	whatsapp		2025-01-25 15:03:27.491162+00	2025-01-25 15:03:27.491162+00	\N
d7ed7c25-24b5-4f22-9250-1dcb6ad4149f	06291be6-9193-4f20-bab0-672b83fc2510	James	Open	+639993702550	whatsapp		2025-01-25 15:07:36.540753+00	2025-01-25 15:07:36.540753+00	\N
5511ddce-c91d-4d5a-82d1-975198e5eb83	06291be6-9193-4f20-bab0-672b83fc2510	James	Mann	+639993702550	whatsapp		2025-01-26 04:21:38.396569+00	2025-01-26 04:21:38.396569+00	\N
d960270d-efd5-4f9e-b977-39366733f4f1	06291be6-9193-4f20-bab0-672b83fc2510	Ivan	Mons	+639993702550	whatsapp		2025-01-26 04:29:25.29903+00	2025-01-26 04:29:25.29903+00	\N
a5d039fd-4f65-41dc-9ac2-8f22c50b402f	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Hamml	Kakaka	+639993702550	whatsapp		2025-01-27 04:11:09.016964+00	2025-01-27 04:11:09.016964+00	\N
483f7e33-9e3d-4650-aedf-9f54cf53d844	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Mannie	+639993702550	whatsapp		2025-01-27 04:22:45.632218+00	2025-01-27 04:22:45.632218+00	\N
346a1b3c-b638-4365-83c0-45a5ee65b209	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Christian	+639993702550	whatsapp		2025-01-27 04:36:13.2612+00	2025-01-27 04:36:13.2612+00	\N
3323e408-32bf-48d5-ad5c-2d98add1b1de	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Arthurr	+639993702550	whatsapp		2025-01-27 07:22:09.015529+00	2025-01-27 07:22:09.015529+00	\N
fe627a02-71a5-4971-9d05-2b89f65cbe69	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-01-29 06:27:21.434634+00	2025-01-29 06:27:21.434634+00	\N
9dffb255-c11b-4b63-9c31-91495b2fb7ee	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	sadsaa	sadasasd	+631231298312	whatsapp		2025-01-29 06:28:12.012676+00	2025-01-29 06:28:12.012676+00	\N
55749149-0175-4e6c-bae7-dd6c6aabce51	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	jjsadjkash	jsahkajshdk	+639993702550	whatsapp		2025-01-29 06:32:48.034909+00	2025-01-29 06:32:48.034909+00	\N
aae92c17-c37a-40bc-b081-0298fcf689f6	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	asasd	asdasdas	+633242342342343	whatsapp		2025-01-29 06:34:46.535985+00	2025-01-29 06:34:46.535985+00	\N
433d9ef6-d992-458b-8725-e73a1ea6620f	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	ewfweew	werwerwe	+633432243242	whatsapp		2025-01-29 06:37:47.018818+00	2025-01-29 06:37:47.018818+00	\N
dbacbcc1-6a1d-40a7-a5dd-b096c8095438	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	jasasjk	sjahksdaj	+638327982333	whatsapp		2025-01-29 06:42:22.270262+00	2025-01-29 06:42:22.270262+00	\N
f6bf3ce3-711a-430f-a84d-3f81b6872dec	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	saasd	asdadsa	+633242342342	whatsapp		2025-01-29 06:46:43.369298+00	2025-01-29 06:46:43.369298+00	\N
753c7da6-726b-44f1-a0b3-d32e6156b2a1	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	sadasdsa	asdasdsa	+633432424232	whatsapp		2025-01-29 06:49:45.694462+00	2025-01-29 06:49:45.694462+00	\N
10869160-5e7b-44c0-9f81-7527a6c62122	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	jsdashjd	jsahdajs	+638798389423	whatsapp		2025-01-29 06:53:17.580497+00	2025-01-29 06:53:17.580497+00	\N
f8e25233-d4a8-4ff4-8384-dc7f95f30bc2	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	fgfgfgfgfff	fgfgfgff	+63324324242	whatsapp		2025-01-29 06:56:20.607614+00	2025-01-29 06:56:20.607614+00	\N
75c2ce3f-a28a-4dc4-a216-8fa43c28fd31	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	james	sasjksaldj	+639993702550	whatsapp		2025-01-29 07:07:26.053675+00	2025-01-29 07:07:26.053675+00	\N
4ea1a9ef-a0ad-47ca-b05a-85a33d04919f	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	sadas	asdas	+631232213123	whatsapp		2025-01-29 07:24:05.561205+00	2025-01-29 07:24:05.561205+00	\N
7eb043c1-fa71-4de8-a3c1-cbaab0c6278e	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	asdsadasdasd	asdasdas	+633432432432	whatsapp		2025-01-29 07:33:30.915044+00	2025-01-29 07:33:30.915044+00	\N
dd7403b9-47a1-4770-9718-6e85c9d7834d	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	sadassaasdasd	sadasdas	+63323423432	whatsapp		2025-01-29 07:42:29.660211+00	2025-01-29 07:42:29.660211+00	\N
81894383-a4f5-46e1-9284-0a1edea4ed63	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	jhasdjah	jdhkjs	+639993702550	whatsapp		2025-01-29 07:51:00.394728+00	2025-01-29 07:51:00.394728+00	\N
fadd9b17-2f2b-4c74-865f-dc44c3a8614d	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	sadsad	asdadsas	+639820482934	whatsapp		2025-01-30 03:18:30.658461+00	2025-01-30 03:18:30.658461+00	\N
8038e99e-4967-4a29-bfad-59ddec42cf1e	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-01-30 03:26:01.674281+00	2025-01-30 03:26:01.674281+00	\N
860738d5-2e00-40ab-a54f-e30e79bff273	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-01 03:16:41.691867+00	2025-02-01 03:16:41.691867+00	\N
618e61d5-63d5-4e1f-9e69-300b6b9017d4	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-02 06:53:37.465287+00	2025-02-02 06:53:37.465287+00	\N
792eb376-995b-42f5-92e6-81d0727f585a	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-02 06:57:25.390228+00	2025-02-02 06:57:25.390228+00	\N
adf2ed1e-ad55-4b46-936b-5cea1133a026	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-03 10:14:15.870395+00	2025-02-03 10:14:15.870395+00	\N
48acf1b7-de74-4c5f-85dd-6849ee8d9dd0	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-03 14:52:00.307195+00	2025-02-03 14:52:00.307195+00	\N
e68b1a9d-c979-4d3c-9ebf-915046487705	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Jamie	+639993702550	whatsapp		2025-02-03 14:53:52.118669+00	2025-02-03 14:53:52.118669+00	\N
78de4e69-2c77-4ea8-9448-635eedb707ad	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-03 15:18:34.670266+00	2025-02-03 15:18:34.670266+00	\N
fbdf017c-517a-4fb7-bcec-193cf8342d91	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-03 15:28:18.70061+00	2025-02-03 15:28:18.70061+00	\N
a8fabf58-dfbb-45c0-a6de-8a6c42a96295	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infnate	+639993702550	whatsapp		2025-02-03 15:44:41.581331+00	2025-02-03 15:44:41.581331+00	\N
5baa00fa-37e6-4b9e-a6cc-3a2868dd94cd	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	James	+639993702550	whatsapp		2025-02-04 01:51:44.331433+00	2025-02-04 01:51:44.331433+00	\N
93ea15a5-3510-4af8-b793-4ca049e77553	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Mann	+639993702550	whatsapp		2025-02-04 02:10:44.780364+00	2025-02-04 02:10:44.780364+00	\N
ca8c5256-2d6e-411f-8dac-894928b35e0c	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-04 03:01:43.093132+00	2025-02-04 03:01:43.093132+00	\N
51d434c8-3626-4c60-80a4-de23ae517751	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-04 03:07:33.55553+00	2025-02-04 03:07:33.55553+00	\N
6ff37cdc-b308-447d-bb00-059dfd5119f4	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-04 10:09:41.117521+00	2025-02-04 10:09:41.117521+00	\N
e815a44b-6385-4c4d-85dc-e5426496d4a4	c5efeae0-96f5-4f7e-9ba7-69f5ef8ced85	Ivan	Isla	+639993702550	whatsapp		2025-02-04 10:22:29.380268+00	2025-02-04 10:22:29.380268+00	\N
0dc9da79-b308-4728-8431-26036fcc37b5	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-04 12:17:25.921848+00	2025-02-04 12:17:25.921848+00	\N
3957b4cb-a36a-4d25-843e-6a86be1fd368	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-04 13:31:15.67429+00	2025-02-04 13:31:15.67429+00	\N
343b9ccf-4606-4d3d-b001-d10eea03b2da	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Ivan	+639993702550	whatsapp		2025-02-04 14:05:30.788956+00	2025-02-04 14:05:30.788956+00	\N
0887365a-c86f-45d5-a1fa-a929fede5359	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Matt	+639993702550	whatsapp		2025-02-04 14:14:44.396927+00	2025-02-04 14:14:44.396927+00	\N
6123776e-2792-4a73-9480-068d0a587d59	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Corinne	Bustos	+639993702550	whatsapp		2025-02-04 14:20:28.247108+00	2025-02-04 14:20:28.247108+00	\N
4803d086-873c-49e4-b590-28c60d29cb01	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Arthur	+639993702550	whatsapp		2025-02-04 15:01:33.017337+00	2025-02-04 15:01:33.017337+00	\N
dd0a5b0e-fff7-4a40-b98c-e0fbdb0641d8	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	mamamam	+6399939083423	whatsapp		2025-02-04 15:05:22.409239+00	2025-02-04 15:05:22.409239+00	\N
093aa7d2-6e48-49eb-8413-02b4ad1ffc75	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Hamma	Hamm	+639993702550	whatsapp		2025-02-04 15:09:18.939842+00	2025-02-04 15:09:18.939842+00	\N
5edebf45-f5ca-47bf-ae86-5a54de94c993	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Jamma	+639993702550	whatsapp		2025-02-04 15:16:27.929358+00	2025-02-04 15:16:27.929358+00	\N
abb3cd3d-d94f-4895-837d-21bfcfa25199	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-05 01:49:06.43835+00	2025-02-05 01:49:06.43835+00	\N
12c6e229-fc36-4667-af75-9be607d265cf	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-05 03:04:07.129172+00	2025-02-05 03:04:07.129172+00	\N
0bd53c91-83e7-44a2-8436-63f0ad8f682c	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Jamie	Mamy	+639993702550	whatsapp		2025-02-05 03:07:09.6907+00	2025-02-05 03:07:09.6907+00	\N
d465e2b1-af7d-420f-b7ff-0187d80c2d3e	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Jay	Jay	+639993702550	whatsapp		2025-02-05 03:10:17.855701+00	2025-02-05 03:10:17.855701+00	\N
2896c62c-de0d-47ca-8ae1-c5833e4a639f	c5efeae0-96f5-4f7e-9ba7-69f5ef8ced85	Jammm	Jamm	+639993702550	whatsapp		2025-02-05 03:17:23.556446+00	2025-02-05 03:17:23.556446+00	\N
2b3da40a-8cee-4d40-aeb9-fe80cf0c1ac5	c5efeae0-96f5-4f7e-9ba7-69f5ef8ced85	Jaja	Omi	+639993702550	whatsapp		2025-02-05 03:19:45.300968+00	2025-02-05 03:19:45.300968+00	\N
8d9caf6f-5546-404e-80f6-6603f34ad68c	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-06 11:33:23.877102+00	2025-02-06 11:33:23.877102+00	\N
a88bad15-4890-46c1-934f-6cfdd7acc4d3	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-06 11:33:52.869568+00	2025-02-06 11:33:52.869568+00	\N
6f9ef4e4-0f29-48d6-a0ca-9ae7ae7fa604	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-06 14:02:47.19176+00	2025-02-06 14:02:47.19176+00	\N
6254f302-2d4c-4c07-9049-65073e462f10	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-06 14:07:42.592072+00	2025-02-06 14:07:42.592072+00	\N
bde5960b-d24c-40ec-8a3e-cb6364740f5b	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-06 14:10:57.868506+00	2025-02-06 14:10:57.868506+00	\N
386276c2-03d7-4a5e-b2d7-e57e86dabc38	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-06 14:13:35.131969+00	2025-02-06 14:13:35.131969+00	\N
1af9cf65-44bf-4f60-a129-627f11407767	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Mikkie	+639993702550	whatsapp		2025-02-06 15:34:02.54462+00	2025-02-06 15:34:02.54462+00	\N
ac783d19-4ad3-4c11-b044-c6048ed823b1	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-06 15:39:24.124702+00	2025-02-06 15:39:24.124702+00	\N
d8e0de05-901f-402e-a4c7-ce7c19c55b21	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-06 15:46:28.772209+00	2025-02-06 15:46:28.772209+00	\N
69097a10-7b8c-4a4d-9ea6-43a52de15e77	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Abuya	+63999370250	whatsapp		2025-02-06 15:50:53.674896+00	2025-02-06 15:50:53.674896+00	\N
fc6b1444-85ed-4e8c-8e7a-16d0f51ef817	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-06 16:51:21.441406+00	2025-02-06 16:51:21.441406+00	\N
b73753f2-2e8b-4e2d-87b3-47c211b900e8	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Jamie	Jamii	+639993702550	whatsapp		2025-02-06 17:17:38.563114+00	2025-02-06 17:17:38.563114+00	\N
76ca69d1-5f84-4a60-aeaa-7963a3621d01	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Jams	Mmma	+639993702550	whatsapp		2025-02-06 17:25:19.976721+00	2025-02-06 17:25:19.976721+00	\N
1e396529-a0ec-4ff8-a7ed-c151533a9020	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Hdhxjxj	Hxjxjxjx	+639993702550	whatsapp		2025-02-06 17:37:14.414302+00	2025-02-06 17:37:14.414302+00	\N
1ab77101-3432-4376-9824-65b36b86a86d	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-07 09:46:11.067298+00	2025-02-07 09:46:11.067298+00	\N
9fbba318-2100-453c-b84a-22f5c832e7e5	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-07 09:52:35.68966+00	2025-02-07 09:52:35.68966+00	\N
10fdc41a-8811-424a-8131-4fecddb7decc	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-07 09:56:29.941029+00	2025-02-07 09:56:29.941029+00	\N
53cb0bae-cc8c-444f-8d5c-75e1f28832db	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	ivan	infante	+639993702550	whatsapp		2025-02-07 10:40:37.132743+00	2025-02-07 10:40:37.132743+00	\N
2b037915-cb22-4eb7-b622-226507769e1d	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-07 15:20:15.92438+00	2025-02-07 15:20:15.92438+00	\N
db3c3395-0873-4791-9024-e6de7778d5a2	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	ivan	infante	+639993702550	whatsapp		2025-02-09 16:56:41.779806+00	2025-02-09 16:56:41.779806+00	\N
2e3b3618-6470-4259-8d9a-dd40eeab89bf	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-09 17:06:23.766585+00	2025-02-09 17:06:23.766585+00	\N
a254f6af-5135-4005-acb8-a8de8a6e2ecf	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-12 09:44:32.720717+00	2025-02-12 09:44:32.720717+00	\N
17a78b2e-6f9a-436c-ba35-da1855dd12f2	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-12 13:37:44.663249+00	2025-02-12 13:37:44.663249+00	\N
bd5a6a4f-3364-4d88-a22d-8f0271ff5469	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Jamie	Mann	+639993702550	whatsapp		2025-02-12 13:43:30.190337+00	2025-02-12 13:43:30.190337+00	\N
ab37c399-b1d2-4524-9925-aa6fc1c01c2b	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-15 07:20:40.968213+00	2025-02-15 07:20:40.968213+00	\N
f3b2a97e-9110-4ab4-a175-5a88eb64aa13	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-15 07:29:43.165553+00	2025-02-15 07:29:43.165553+00	\N
e59e45bb-6f0b-43e3-a882-08093ae6da19	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-15 07:31:55.987075+00	2025-02-15 07:31:55.987075+00	\N
4e9765b2-e90c-416a-b79c-fac7955f8085	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-15 07:37:21.849468+00	2025-02-15 07:37:21.849468+00	\N
cf4ec926-5fb8-4e6f-b0eb-74768e801b67	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-15 07:46:08.456637+00	2025-02-15 07:46:08.456637+00	\N
872b5db6-8cd5-46e6-9c8e-15546f9008d7	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-15 07:55:04.695517+00	2025-02-15 07:55:04.695517+00	\N
611861dd-7e0a-479a-abfb-55fbcd097dce	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+63993702550	whatsapp		2025-02-15 09:09:50.227878+00	2025-02-15 09:09:50.227878+00	\N
ecf16a6d-dffb-42e1-9f22-6e62b8f8c7f1	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+63993702550	whatsapp		2025-02-15 09:12:38.981212+00	2025-02-15 09:12:38.981212+00	\N
3785cd29-2af7-40b8-bfe0-02e48b0d0cee	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	+639993702550	whatsapp		2025-02-15 09:16:36.968596+00	2025-02-15 09:16:36.968596+00	\N
43468b80-ee07-4b8a-8a47-97b8d4659896	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Jammm	+639993702550	whatsapp		2025-02-15 14:17:15.219581+00	2025-02-15 14:17:15.219581+00	\N
d8a3ed8a-85db-4c03-95cb-a8c38b9880b0	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Hanm	Jajaja	+639993702550	whatsapp		2025-02-15 14:22:06.534382+00	2025-02-15 14:22:06.534382+00	\N
f453a08e-0222-4c53-9e49-90c11e91fe18	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	James	Mann	+639993702550	whatsapp		2025-02-15 14:25:47.82655+00	2025-02-15 14:25:47.82655+00	\N
71e6ca09-71b6-4e4d-8427-cc7fed2217fa	b4b35728-83c1-4798-a12d-bab245860290	Jam	Jam	+639993702550	whatsapp		2025-02-17 06:48:41.003133+00	2025-02-17 06:48:41.003133+00	\N
363823d0-cd2a-46a4-aa03-8d6766cf0b64	b4b35728-83c1-4798-a12d-bab245860290	Jamm	Jamm	+639993702550	whatsapp		2025-02-17 08:43:48.165025+00	2025-02-17 08:43:48.165025+00	\N
95eea074-2e0d-42b8-bf59-f8c341e8ee75	b4b35728-83c1-4798-a12d-bab245860290	Jaja	Jaja	+639993702550	whatsapp		2025-02-17 08:51:39.584477+00	2025-02-17 08:51:39.584477+00	\N
08c8d72a-c2bd-4375-b7da-3babe1bd3e46	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Jammaa	+639993702550	whatsapp		2025-02-17 10:40:13.832718+00	2025-02-17 10:40:13.832718+00	\N
f2cb4b99-b714-4594-bf9d-056189de604a	b4b35728-83c1-4798-a12d-bab245860290	asdas	dasdas	+639993702550	whatsapp		2025-02-17 12:06:50.502923+00	2025-02-17 12:06:50.502923+00	\N
3e5e6998-4de5-4fcb-9d89-c4ffa7d0d1df	b4b35728-83c1-4798-a12d-bab245860290	Jam	Jamie	+639993702550	whatsapp		2025-02-18 04:27:27.931229+00	2025-02-18 04:27:27.931229+00	\N
\.


--
-- Data for Name: driver_application_drafts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.driver_application_drafts (id, user_id, form_data, current_step, last_updated) FROM stdin;
288eb1f4-32f4-408f-8287-dd2506e315be	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	{"email": "ivanxinfante@gmail.com", "address": "", "bankName": "", "fullName": "James", "cpcNumber": "", "orCrNumber": "", "tnvsNumber": "", "licenseType": "", "plateNumber": "", "vehicleMake": "", "vehicleYear": "", "mobileNumber": "", "policyNumber": "", "vehicleColor": "", "vehicleModel": "", "accountHolder": "", "accountNumber": "", "licenseNumber": "", "termsAccepted": false, "privacyAccepted": false, "policyExpiration": "", "insuranceProvider": "", "licenseExpiration": ""}	1	2025-02-13 16:15:33.822+00
\.


--
-- Data for Name: driver_applications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.driver_applications (id, user_id, driver_id, full_name, email, mobile_number, address, license_number, license_expiration, license_type, vehicle_make, vehicle_model, vehicle_year, plate_number, or_cr_number, vehicle_color, insurance_provider, policy_number, policy_expiration, tnvs_number, cpc_number, bank_name, account_number, account_holder, driver_license_url, or_cr_url, insurance_url, vehicle_front_url, vehicle_side_url, vehicle_rear_url, nbi_clearance_url, medical_certificate_url, status, notes, reviewed_by, reviewed_at, created_at, updated_at, documents, terms_accepted, privacy_accepted) FROM stdin;
26807f26-e87d-4af9-bca0-7206bcd58228	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	2b143c4c-bbe4-45c8-909d-98c429a22013	Ham Ware	ivanxinfante@gmail.com	9993702550	sadasd	asdasd	2025-01-29	professional	asdasd	asdasd	2021	asdasd	asdasd	asdasd	asdsad	asdasdsad	2025-01-29	asdasd	asdasd	BDO	asasdas	asadsasd	\N	\N	\N	\N	\N	\N	\N	\N	approved	Well done.	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	2025-01-26 12:50:06.375+00	2025-01-26 12:27:21.003387+00	2025-02-09 06:29:31.349139+00	{"or_cr": null, "insurance": null, "vehicle_rear": null, "vehicle_side": null, "nbi_clearance": null, "vehicle_front": null, "driver_license": null, "medical_certificate": null}	f	f
\.


--
-- Data for Name: driver_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.driver_assignments (id, booking_id, driver_id, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: driver_availability; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.driver_availability (id, driver_id, day_of_week, location, created_at, updated_at, recurrence_rule, exception_dates, start_time, end_time, route_id, status, date) FROM stdin;
18772450-dc35-406d-a818-ab9f73c8c691	c5efeae0-96f5-4f7e-9ba7-69f5ef8ced85	5	Puerto Princesa	2025-02-06 04:09:59.914038+00	2025-02-06 04:09:59.914038+00	\N	\N	08:00:00	23:59:59	\N	available	2025-02-18
\.


--
-- Data for Name: driver_notification_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.driver_notification_logs (id, booking_id, status_code, response, created_at) FROM stdin;
7d050dc7-c7e5-49d9-bdf9-5a6850d7cd46	76c2ca48-49e2-4da1-a182-1e450a537947	500	A server error has occurred\n\nFUNCTION_INVOCATION_FAILED\n\niad1::7k6rh-1738908380928-618d604f94b3\n	2025-02-07 06:06:20.873362+00
791d8244-fd6e-45f8-b4e6-4234821f69ae	4bee6e39-f5b4-4406-bd98-f5aef3783885	500	A server error has occurred\n\nFUNCTION_INVOCATION_FAILED\n\niad1::xx297-1738921958088-fadb2cdebb37\n	2025-02-07 09:52:37.962257+00
b568c35f-73c6-4001-b299-374ee6ea246d	325773ec-99c7-4779-b586-623e78d77deb	500	A server error has occurred\n\nFUNCTION_INVOCATION_FAILED\n\niad1::2m6lz-1738922223706-45edbd2042b4\n	2025-02-07 09:57:03.645518+00
455784e2-167c-49d1-9414-353ca24d4c88	c1b407a0-7b8b-48e7-b453-f05c15a2791c	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-07 15:20:18.644821+00
d92fd8c3-785f-4bcc-816d-f45103c6226e	86cf057f-d55a-4551-9f43-3e0996548388	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-09 16:56:44.058955+00
03aec7da-888e-47fd-82d4-4fd6c5e5cebf	5b0a53a7-521b-4b9c-aebe-29eec45c8662	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-09 17:06:25.638001+00
fc456fa4-3696-44c7-bf87-6c5a87f2a996	a65db418-f32c-43f6-a767-a3ba0bfee1a8	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-12 09:44:35.04544+00
4d286ba6-6f37-4aa4-97b8-1ff660b8e7cb	c2b54121-ded2-4ecd-9964-921cd4ada37e	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-12 13:37:46.608617+00
72cea17b-fc24-47c9-94db-adb2f48cf773	2d1992e8-4bdc-4f9b-abe0-805022dc7940	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-12 13:43:32.016906+00
7b9490de-db17-4ccd-8d25-05facb51b0b9	873f4858-e7a5-4690-a2ea-73876ed2b5ac	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-15 07:31:57.675076+00
ced5600f-f2de-4bca-9ee4-5057838c9a7c	d6377162-7832-4230-b42c-349eb38d0737	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-15 07:37:23.41881+00
5072846a-7c73-4b16-8492-1940f588ec82	0c8d3a58-1d30-42ea-8661-8b656f0acefb	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-15 07:46:09.838852+00
3668d960-8057-414f-80e7-4fcd9b49a9a9	e2ea5776-3b00-4fae-8216-543bcab3ec28	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-15 07:55:05.859372+00
c89d968d-8ced-4a29-a8c4-702c5732202a	d192afc2-5c35-48f4-afb8-ec18fb0b338a	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-15 09:12:40.775819+00
90d6b500-6e28-4713-99e6-8bd1529252c0	194ad621-2664-481e-96de-d4f870e3b33d	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-15 09:16:38.310291+00
69ff4f66-45d8-47d7-96c7-395292d93010	aaf066e2-8359-4fae-b9bd-d2f2bda250bf	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-15 14:17:17.54863+00
3608fa76-85fd-4169-830d-2cdb2dac2c57	90055c5a-c600-405f-b8dd-6ed476e09a78	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-15 14:22:08.045287+00
8302dc26-10a4-4906-bdc5-11dec4171e90	7528729e-1143-4ccb-9642-39e3b2374bc4	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-15 14:25:49.425095+00
28dbc2ed-15bc-45a9-8974-054a39987143	b91f364e-5254-4010-950b-4f79eb828338	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-17 06:48:43.299846+00
8aeb8bcf-eb64-4cb8-bb92-b0f067c25757	cf409525-9c04-46d4-bd06-7a7fb3c61c54	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-17 08:43:49.707514+00
e69c76a5-ba81-4a79-be82-c93396560e15	a461ea26-92ec-47ab-8caf-a09770a23d3b	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-17 08:51:41.175243+00
18337924-1b5a-4346-a049-85632b66b374	ab527529-7f54-4b54-bd72-8b4a6066e2c1	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-17 10:40:15.394025+00
5895a47a-5d55-4a2a-b5cf-09407f507216	6022c8f1-f495-4ac1-8d4c-189cd9a408f1	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-17 12:06:52.134113+00
8f096bcc-552a-4af6-94ba-f4f7ac9d3a3a	7e64ffa0-9669-402f-bdf5-da99e12582a9	500	{"error": "Timeout or connection error: query has no destination for result data"}	2025-02-18 04:27:29.517285+00
\.


--
-- Data for Name: driver_notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.driver_notifications (id, driver_id, booking_id, status, created_at, updated_at, acceptance_code, expires_at, responded_at, response_code, response_time) FROM stdin;
91392899-0285-4910-8365-965832b0ead1	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	41c1749f-b989-4aaa-82a5-7bf6e98ad6be	ACCEPTED	2025-02-08 14:31:28.906724+00	2025-02-08 14:31:28.906724+00	WLY2TF	2025-02-08 15:01:28.738+00	2025-02-08 14:33:52.632+00	\N	\N
0c797b50-4f9e-42d4-aa56-8e2f17c0cf70	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	4ba65572-e193-4c3c-9a0e-6c9b702d11e7	REJECTED	2025-02-08 14:32:40.283151+00	2025-02-08 14:32:40.283151+00	4P46HB	2025-02-08 15:02:40.12+00	2025-02-08 15:11:35.414+00	\N	\N
39fa3a2c-65a6-4e06-87b9-fa44b7587949	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	9b2d2a91-e8ef-4f64-a313-a025a7c9def7	ACCEPTED	2025-02-08 15:12:08.879701+00	2025-02-08 15:12:08.879701+00	5RRSOY	2025-02-08 15:42:08.239+00	2025-02-08 15:12:37.681+00	\N	\N
43a3a751-3cd6-4b79-9f8d-164c4b921c54	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	83516cbf-46b1-41d6-ac5d-c5f823eef0df	ACCEPTED	2025-02-08 15:18:01.433571+00	2025-02-08 15:18:01.433571+00	6IAMPE	2025-02-08 15:48:01.259+00	2025-02-08 15:25:44.246+00	\N	\N
17249b9d-df7c-457e-a704-02b184a07205	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	946efa49-eec5-435f-a50a-e670f35620a8	REJECTED	2025-02-08 15:21:06.716035+00	2025-02-08 15:21:06.716035+00	B7HR1Y	2025-02-08 15:51:06.536+00	2025-02-15 14:16:39.952+00	\N	\N
9f548ceb-ac4b-4173-84c3-1e1dfe1976b9	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	fc932ff3-c48d-408f-b911-adf0f381fbef	REJECTED	2025-02-08 15:21:26.173079+00	2025-02-08 15:21:26.173079+00	V7MSZS	2025-02-08 15:51:25.998+00	2025-02-15 14:16:43.042+00	\N	\N
\.


--
-- Data for Name: drivers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.drivers (id, name, license_number, contact_number, emergency_contact, status, documents_verified, license_expiry, notes, created_at, updated_at, mobile_number, service_types, current_location, current_booking_id, is_available, photo_url, user_id) FROM stdin;
07bdfe33-ebd7-4b6b-b679-97508a721a70	Test Driver	TEST-123-456	+639993702550	\N	active	t	2025-12-31	\N	2025-02-06 09:44:53.786328+00	2025-02-06 09:44:53.786328+00	+639993702550	{shared,private15,private10}	Puerto Princesa	\N	t	\N	\N
d9db604c-2087-479e-b0e7-e5a4830f1ff3	James Mann	TEST124	+639993702550	\N	active	t	2025-12-31	\N	2025-02-06 11:44:35.498032+00	2025-02-07 06:41:49.401877+00	+639993702550	\N	\N	\N	t	\N	\N
681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan Infante	TEST123	+639993702550	\N	active	t	2025-12-31	\N	2025-02-08 14:14:08.651381+00	2025-02-08 14:14:08.651381+00	+639993702550	\N	\N	\N	t	\N	\N
2b143c4c-bbe4-45c8-909d-98c429a22013	Ham Ware	asdasd	9993702550	\N	active	f	2025-01-29	\N	2025-02-09 06:23:10.219559+00	2025-02-09 06:44:12.665503+00	\N	\N	\N	\N	t	2b143c4c-bbe4-45c8-909d-98c429a22013-1739083449236.jpg	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27
\.


--
-- Data for Name: notification_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_logs (id, driver_id, trip_assignment_id, notification_type, message, status, twilio_message_id, error_message, created_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, booking_id, amount, status, provider, provider_payment_id, provider_session_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, full_name, mobile_number, date_of_birth, bio, avatar_url, created_at, role) FROM stdin;
50336b54-d231-46b8-ad34-8814fc3a3558	\N	\N	\N	\N	\N	2025-01-21 14:56:48.672112+00	user
8ce15d17-4d8d-44c0-92c4-f6bce32a025a	\N	\N	\N	\N	\N	2025-01-21 15:31:54.841466+00	user
ac6124fc-7bda-42da-97a0-a987e6496f01	\N	\N	\N	\N	\N	2025-01-21 15:47:24.062583+00	user
9ed86db7-3338-49c4-8e79-2a2ddbe57f0b	\N	\N	\N	\N	\N	2025-01-23 15:09:19.189409+00	user
06291be6-9193-4f20-bab0-672b83fc2510	\N	\N	\N	\N	\N	2025-01-25 15:02:03.882457+00	user
7f87032e-df48-4715-9244-9dd8f2e04273	Corinne Bustos	+639673102560	1991-03-08	My handsome husband is the CEO of islaGo	https://achpbaomhjddqycgzomw.supabase.co/storage/v1/object/public/avatars/avatars/7f87032e-df48-4715-9244-9dd8f2e04273-0.7929479934313396.jpeg	2025-01-25 14:59:19.315821+00	user
9ec00e8f-91f0-4024-8978-166e20a40c4f	\N	\N	\N	\N	\N	2025-01-28 11:04:57.354695+00	user
cd2c7897-2ae0-40a8-a32e-c2103114fe53	\N	\N	\N	\N	\N	2025-01-28 11:13:16.338316+00	user
8421d3e6-2b83-41c9-8ba0-32e2976ad4f8	\N	\N	\N	\N	\N	2025-01-28 11:15:26.509182+00	user
785dc310-ef70-40b9-8734-76a717b3c579	\N	\N	\N	\N	\N	2025-01-28 11:56:35.877323+00	user
681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan Infante	\N	\N	Corinne stinky.	https://achpbaomhjddqycgzomw.supabase.co/storage/v1/object/public/avatars/avatars/681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27-0.11945422422919871.JPG	2025-01-20 06:51:58.619854+00	user
c5efeae0-96f5-4f7e-9ba7-69f5ef8ced85	IslaGo	\N	\N	\N	\N	2025-02-02 15:31:47.520233+00	user
b4b35728-83c1-4798-a12d-bab245860290	Test Account	\N	\N	\N	\N	2025-01-22 10:06:22.414428+00	user
\.


--
-- Data for Name: routes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.routes (id, from_location, to_location, base_price, estimated_duration, status, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: staff_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff_roles (id, user_id, role, created_at, updated_at) FROM stdin;
3aeaa17d-0073-4d30-84ef-b6bdaceb8ef8	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	admin	2025-01-22 09:53:35.507426+00	2025-01-22 09:53:35.507426+00
db830086-d122-43c8-88fb-3878a2bd59e8	b4b35728-83c1-4798-a12d-bab245860290	admin	2025-01-22 10:07:20.133309+00	2025-01-22 10:07:20.133309+00
\.


--
-- Data for Name: staff_roles_old; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff_roles_old (id, user_id, role, permissions, created_at, updated_at) FROM stdin;
0399eae9-5f59-4099-8f86-e6d7bea53596	43b99cde-ce9e-4324-b813-163539c28a6a	admin	{}	2025-01-20 04:16:39.049875+00	2025-01-20 05:12:23.139129+00
\.


--
-- Data for Name: trip_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trip_assignments (id, booking_id, vehicle_id, driver_id, departure_time, status, notes, created_at, updated_at) FROM stdin;
009da6e0-7d5a-41a6-9475-da4f2953aa53	83516cbf-46b1-41d6-ac5d-c5f823eef0df	\N	681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	2025-02-08 06:00:00+00	pending	\N	2025-02-08 15:25:36.435+00	2025-02-08 15:25:36.435+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, first_name, last_name, phone, created_at, updated_at, role) FROM stdin;
c5efeae0-96f5-4f7e-9ba7-69f5ef8ced85	IslaGo		\N	2025-02-04 10:21:59.118+00	2025-02-04 10:21:59.4955+00	user
681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27	Ivan	Infante	\N	2025-02-05 02:34:40.432+00	2025-02-05 02:34:40.869703+00	user
b4b35728-83c1-4798-a12d-bab245860290	Ivan		\N	2025-02-05 03:00:54.758+00	2025-02-05 03:00:55.168161+00	user
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicles (id, plate_number, model, capacity, status, last_maintenance_date, notes, created_at, updated_at) FROM stdin;
cc811294-b8c9-43ef-bcd4-a714aea385fd	TEST-123	HiAce	15	active	\N	\N	2025-02-06 09:44:27.185693+00	2025-02-06 09:44:27.185693+00
\.


--
-- Name: admin_access admin_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_access
    ADD CONSTRAINT admin_access_pkey PRIMARY KEY (user_id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: driver_application_drafts driver_application_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_application_drafts
    ADD CONSTRAINT driver_application_drafts_pkey PRIMARY KEY (id);


--
-- Name: driver_application_drafts driver_application_drafts_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_application_drafts
    ADD CONSTRAINT driver_application_drafts_user_id_key UNIQUE (user_id);


--
-- Name: driver_applications driver_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_applications
    ADD CONSTRAINT driver_applications_pkey PRIMARY KEY (id);


--
-- Name: driver_assignments driver_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_assignments
    ADD CONSTRAINT driver_assignments_pkey PRIMARY KEY (id);


--
-- Name: driver_availability driver_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_availability
    ADD CONSTRAINT driver_availability_pkey PRIMARY KEY (id);


--
-- Name: driver_notification_logs driver_notification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_notification_logs
    ADD CONSTRAINT driver_notification_logs_pkey PRIMARY KEY (id);


--
-- Name: driver_notifications driver_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_notifications
    ADD CONSTRAINT driver_notifications_pkey PRIMARY KEY (id);


--
-- Name: drivers drivers_license_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_license_number_key UNIQUE (license_number);


--
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (id);


--
-- Name: notification_logs notification_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: routes routes_from_location_to_location_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_from_location_to_location_key UNIQUE (from_location, to_location);


--
-- Name: routes routes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.routes
    ADD CONSTRAINT routes_pkey PRIMARY KEY (id);


--
-- Name: staff_roles staff_roles_new_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_roles
    ADD CONSTRAINT staff_roles_new_pkey PRIMARY KEY (id);


--
-- Name: staff_roles_old staff_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_roles_old
    ADD CONSTRAINT staff_roles_pkey PRIMARY KEY (id);


--
-- Name: staff_roles_old staff_roles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_roles_old
    ADD CONSTRAINT staff_roles_user_id_key UNIQUE (user_id);


--
-- Name: trip_assignments trip_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_assignments
    ADD CONSTRAINT trip_assignments_pkey PRIMARY KEY (id);


--
-- Name: driver_availability unique_driver_availability; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_availability
    ADD CONSTRAINT unique_driver_availability UNIQUE (driver_id, date, start_time, end_time);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_plate_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_plate_number_key UNIQUE (plate_number);


--
-- Name: idx_bookings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);


--
-- Name: idx_customers_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_email ON public.customers USING btree (email);


--
-- Name: idx_driver_applications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_driver_applications_status ON public.driver_applications USING btree (status);


--
-- Name: idx_driver_applications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_driver_applications_user_id ON public.driver_applications USING btree (user_id);


--
-- Name: idx_driver_availability_composite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_driver_availability_composite ON public.driver_availability USING btree (driver_id, date, status);


--
-- Name: idx_driver_availability_date_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_driver_availability_date_time ON public.driver_availability USING btree (date, start_time, end_time);


--
-- Name: idx_driver_availability_day; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_driver_availability_day ON public.driver_availability USING btree (day_of_week);


--
-- Name: idx_driver_availability_driver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_driver_availability_driver ON public.driver_availability USING btree (driver_id);


--
-- Name: idx_driver_notifications_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_driver_notifications_status ON public.driver_notifications USING btree (status);


--
-- Name: profiles_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX profiles_role_idx ON public.profiles USING btree (role);


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: bookings on_booking_paid; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_booking_paid AFTER UPDATE ON public.bookings FOR EACH ROW WHEN (((new.payment_status = 'paid'::text) AND (old.payment_status <> 'paid'::text))) EXECUTE FUNCTION public.notify_drivers();


--
-- Name: driver_applications on_driver_application_approved; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_driver_application_approved AFTER UPDATE ON public.driver_applications FOR EACH ROW EXECUTE FUNCTION public.add_driver_role();


--
-- Name: driver_applications update_driver_applications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_driver_applications_updated_at BEFORE UPDATE ON public.driver_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: drivers update_drivers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: routes update_routes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON public.routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: staff_roles_old update_staff_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_staff_roles_updated_at BEFORE UPDATE ON public.staff_roles_old FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: trip_assignments update_trip_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_trip_assignments_updated_at BEFORE UPDATE ON public.trip_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vehicles update_vehicles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_access admin_access_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_access
    ADD CONSTRAINT admin_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: bookings bookings_assigned_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_assigned_driver_id_fkey FOREIGN KEY (assigned_driver_id) REFERENCES public.drivers(id);


--
-- Name: bookings bookings_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: customers customers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: driver_application_drafts driver_application_drafts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_application_drafts
    ADD CONSTRAINT driver_application_drafts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: driver_applications driver_applications_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_applications
    ADD CONSTRAINT driver_applications_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: driver_applications driver_applications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_applications
    ADD CONSTRAINT driver_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: driver_applications driver_applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_applications
    ADD CONSTRAINT driver_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: driver_assignments driver_assignments_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_assignments
    ADD CONSTRAINT driver_assignments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: driver_assignments driver_assignments_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_assignments
    ADD CONSTRAINT driver_assignments_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: driver_availability driver_availability_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_availability
    ADD CONSTRAINT driver_availability_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: driver_availability driver_availability_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_availability
    ADD CONSTRAINT driver_availability_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.routes(id);


--
-- Name: driver_notification_logs driver_notification_logs_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_notification_logs
    ADD CONSTRAINT driver_notification_logs_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: driver_notifications driver_notifications_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_notifications
    ADD CONSTRAINT driver_notifications_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: driver_notifications driver_notifications_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_notifications
    ADD CONSTRAINT driver_notifications_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: drivers drivers_current_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_current_booking_id_fkey FOREIGN KEY (current_booking_id) REFERENCES public.bookings(id);


--
-- Name: drivers drivers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: driver_applications fk_reviewed_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.driver_applications
    ADD CONSTRAINT fk_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: notification_logs notification_logs_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: notification_logs notification_logs_trip_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_logs
    ADD CONSTRAINT notification_logs_trip_assignment_id_fkey FOREIGN KEY (trip_assignment_id) REFERENCES public.trip_assignments(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: trip_assignments trip_assignments_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_assignments
    ADD CONSTRAINT trip_assignments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;


--
-- Name: trip_assignments trip_assignments_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_assignments
    ADD CONSTRAINT trip_assignments_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;


--
-- Name: trip_assignments trip_assignments_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_assignments
    ADD CONSTRAINT trip_assignments_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: trip_assignments Admins can modify trip assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can modify trip assignments" ON public.trip_assignments TO authenticated USING ((auth.uid() IN ( SELECT staff_roles_old.user_id
   FROM public.staff_roles_old
  WHERE (staff_roles_old.role = 'admin'::public.user_role))));


--
-- Name: profiles Anyone can view profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);


--
-- Name: trip_assignments Drivers can insert their own trip assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Drivers can insert their own trip assignments" ON public.trip_assignments FOR INSERT TO authenticated WITH CHECK ((auth.uid() = driver_id));


--
-- Name: driver_availability Drivers can manage their own availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Drivers can manage their own availability" ON public.driver_availability USING ((auth.uid() = driver_id));


--
-- Name: bookings Drivers can update assigned booking status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Drivers can update assigned booking status" ON public.bookings FOR UPDATE TO authenticated USING (((id IN ( SELECT trip_assignments.booking_id
   FROM public.trip_assignments
  WHERE (trip_assignments.driver_id = auth.uid()))) AND (EXISTS ( SELECT 1
   FROM public.staff_roles
  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'driver'::text)))))) WITH CHECK (((id IN ( SELECT trip_assignments.booking_id
   FROM public.trip_assignments
  WHERE (trip_assignments.driver_id = auth.uid()))) AND (EXISTS ( SELECT 1
   FROM public.staff_roles
  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'driver'::text))))));


--
-- Name: driver_assignments Drivers can update their own assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Drivers can update their own assignments" ON public.driver_assignments FOR UPDATE USING ((auth.uid() = driver_id));


--
-- Name: drivers Drivers can update their own status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Drivers can update their own status" ON public.drivers FOR UPDATE TO authenticated USING (((id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.staff_roles
  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'driver'::text)))))) WITH CHECK (((id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.staff_roles
  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'driver'::text))))));


--
-- Name: trip_assignments Drivers can update their own trip assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Drivers can update their own trip assignments" ON public.trip_assignments FOR UPDATE TO authenticated USING ((auth.uid() = driver_id)) WITH CHECK ((auth.uid() = driver_id));


--
-- Name: bookings Drivers can view assigned bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Drivers can view assigned bookings" ON public.bookings FOR SELECT TO authenticated USING (((id IN ( SELECT trip_assignments.booking_id
   FROM public.trip_assignments
  WHERE (trip_assignments.driver_id = auth.uid()))) AND (EXISTS ( SELECT 1
   FROM public.staff_roles
  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'driver'::text))))));


--
-- Name: vehicles Drivers can view assigned vehicles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Drivers can view assigned vehicles" ON public.vehicles FOR SELECT TO authenticated USING (((id IN ( SELECT trip_assignments.vehicle_id
   FROM public.trip_assignments
  WHERE (trip_assignments.driver_id = auth.uid()))) AND (EXISTS ( SELECT 1
   FROM public.staff_roles
  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'driver'::text))))));


--
-- Name: bookings Drivers can view their assigned bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Drivers can view their assigned bookings" ON public.bookings FOR SELECT TO authenticated USING (((id IN ( SELECT trip_assignments.booking_id
   FROM public.trip_assignments
  WHERE (trip_assignments.driver_id = auth.uid()))) OR (assigned_driver_id = auth.uid())));


--
-- Name: trip_assignments Drivers can view their assigned trips; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Drivers can view their assigned trips" ON public.trip_assignments FOR SELECT TO authenticated USING (((driver_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.staff_roles
  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'driver'::text))))));


--
-- Name: driver_assignments Drivers can view their own assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Drivers can view their own assignments" ON public.driver_assignments FOR SELECT USING ((auth.uid() = driver_id));


--
-- Name: drivers Drivers can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Drivers can view their own profile" ON public.drivers FOR SELECT TO authenticated USING (((id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.staff_roles
  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'driver'::text))))));


--
-- Name: trip_assignments Drivers can view their own trip assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Drivers can view their own trip assignments" ON public.trip_assignments FOR SELECT TO authenticated USING ((auth.uid() = driver_id));


--
-- Name: trip_assignments Drivers can view their own trips; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Drivers can view their own trips" ON public.trip_assignments FOR SELECT TO authenticated USING (((driver_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.staff_roles
  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = ANY (ARRAY['admin'::text, 'staff'::text])))))));


--
-- Name: bookings Enable all for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all for authenticated users" ON public.bookings TO authenticated USING (true) WITH CHECK (true);


--
-- Name: customers Enable all for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all for authenticated users" ON public.customers TO authenticated USING (true) WITH CHECK (true);


--
-- Name: staff_roles Enable all operations for admins and self-view; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all operations for admins and self-view" ON public.staff_roles USING (((auth.uid() = user_id) OR (auth.uid() = '681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27'::uuid)));


--
-- Name: staff_roles Enable read access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for authenticated users" ON public.staff_roles FOR SELECT TO authenticated USING (true);


--
-- Name: staff_roles_old Enable read access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for authenticated users" ON public.staff_roles_old FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: drivers Only admins can modify drivers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can modify drivers" ON public.drivers TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.staff_roles
  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.staff_roles
  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'admin'::text)))));


--
-- Name: routes Only admins can modify routes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can modify routes" ON public.routes TO authenticated USING ((auth.uid() IN ( SELECT staff_roles_old.user_id
   FROM public.staff_roles_old
  WHERE (staff_roles_old.role = 'admin'::public.user_role)))) WITH CHECK ((auth.uid() IN ( SELECT staff_roles_old.user_id
   FROM public.staff_roles_old
  WHERE (staff_roles_old.role = 'admin'::public.user_role))));


--
-- Name: vehicles Only admins can modify vehicles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can modify vehicles" ON public.vehicles TO authenticated USING ((auth.uid() IN ( SELECT staff_roles_old.user_id
   FROM public.staff_roles_old
  WHERE (staff_roles_old.role = 'admin'::public.user_role)))) WITH CHECK ((auth.uid() IN ( SELECT staff_roles_old.user_id
   FROM public.staff_roles_old
  WHERE (staff_roles_old.role = 'admin'::public.user_role))));


--
-- Name: drivers Staff can view drivers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view drivers" ON public.drivers FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.staff_roles
  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = ANY (ARRAY['admin'::text, 'staff'::text]))))));


--
-- Name: routes Staff can view routes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view routes" ON public.routes FOR SELECT TO authenticated USING ((auth.uid() IN ( SELECT staff_roles_old.user_id
   FROM public.staff_roles_old)));


--
-- Name: trip_assignments Staff can view trip assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view trip assignments" ON public.trip_assignments FOR SELECT TO authenticated USING ((auth.uid() IN ( SELECT staff_roles_old.user_id
   FROM public.staff_roles_old)));


--
-- Name: vehicles Staff can view vehicles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff can view vehicles" ON public.vehicles FOR SELECT TO authenticated USING ((auth.uid() IN ( SELECT staff_roles_old.user_id
   FROM public.staff_roles_old)));


--
-- Name: staff_roles Staff roles access policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Staff roles access policy" ON public.staff_roles USING (((EXISTS ( SELECT 1
   FROM public.admin_access
  WHERE ((admin_access.user_id = auth.uid()) AND (admin_access.is_super_admin = true)))) OR (auth.uid() = user_id)));


--
-- Name: trip_assignments Support staff can update pending trips; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Support staff can update pending trips" ON public.trip_assignments FOR UPDATE TO authenticated USING (((auth.uid() IN ( SELECT staff_roles_old.user_id
   FROM public.staff_roles_old
  WHERE (staff_roles_old.role = 'support'::public.user_role))) AND (status = ANY (ARRAY['pending'::public.trip_status, 'confirmed'::public.trip_status])))) WITH CHECK (((auth.uid() IN ( SELECT staff_roles_old.user_id
   FROM public.staff_roles_old
  WHERE (staff_roles_old.role = 'support'::public.user_role))) AND (status = ANY (ARRAY['pending'::public.trip_status, 'confirmed'::public.trip_status]))));


--
-- Name: driver_assignments System can create assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can create assignments" ON public.driver_assignments FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: users Users can insert own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own data" ON public.users FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));


--
-- Name: staff_roles Users can read own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can read own roles" ON public.staff_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: users Users can update own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own data" ON public.users FOR UPDATE TO authenticated USING ((auth.uid() = id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id));


--
-- Name: users Users can view own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING ((auth.uid() = id));


--
-- Name: admin_access; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_access ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_access admin_access_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_access_policy ON public.admin_access USING ((user_id = auth.uid()));


--
-- Name: staff_roles allow_read_own_role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY allow_read_own_role ON public.staff_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: driver_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.driver_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: driver_applications driver_applications_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY driver_applications_policy ON public.driver_applications USING (((EXISTS ( SELECT 1
   FROM public.admin_access
  WHERE ((admin_access.user_id = auth.uid()) AND (admin_access.is_super_admin = true)))) OR (auth.uid() = driver_id)));


--
-- Name: driver_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.driver_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: driver_availability; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.driver_availability ENABLE ROW LEVEL SECURITY;

--
-- Name: drivers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

--
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: routes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_roles staff_roles_access_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_roles_access_policy ON public.staff_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: staff_roles staff_roles_admin_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY staff_roles_admin_policy ON public.staff_roles TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.staff_roles staff_roles_1
  WHERE ((staff_roles_1.user_id = auth.uid()) AND (staff_roles_1.role = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.staff_roles staff_roles_1
  WHERE ((staff_roles_1.user_id = auth.uid()) AND (staff_roles_1.role = 'admin'::text)))));


--
-- Name: staff_roles_old; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.staff_roles_old ENABLE ROW LEVEL SECURITY;

--
-- Name: trip_assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trip_assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: vehicles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_users; Type: MATERIALIZED VIEW DATA; Schema: public; Owner: -
--

REFRESH MATERIALIZED VIEW public.admin_users;


--
-- PostgreSQL database dump complete
--

