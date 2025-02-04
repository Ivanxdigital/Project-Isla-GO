# IslaGo Database Schema & RLS Policies

This file contains the complete database schema (tables and columns), Row-Level Security (RLS) policies, and a reference to installed PostgreSQL extensions for the IslaGo application.

---

## 1. Table Structures
[
  {
    "table_name": "admin_access"
  },
  {
    "table_name": "bookings"
  },
  {
    "table_name": "customers"
  },
  {
    "table_name": "driver_application_drafts"
  },
  {
    "table_name": "driver_applications"
  },
  {
    "table_name": "driver_availability"
  },
  {
    "table_name": "drivers"
  },
  {
    "table_name": "payments"
  },
  {
    "table_name": "profiles"
  },
  {
    "table_name": "routes"
  },
  {
    "table_name": "staff_roles"
  },
  {
    "table_name": "staff_roles_old"
  },
  {
    "table_name": "trip_assignments"
  },
  {
    "table_name": "users"
  },
  {
    "table_name": "vehicles"
  }
]
## 2. Column Information
[
  {
    "table_name": "admin_access",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "admin_access",
    "column_name": "is_super_admin",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "admin_access",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "timezone('utc'::text, now())"
  },
  {
    "table_name": "bookings",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "bookings",
    "column_name": "customer_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "bookings",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "bookings",
    "column_name": "from_location",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "bookings",
    "column_name": "to_location",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "bookings",
    "column_name": "departure_date",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "bookings",
    "column_name": "departure_time",
    "data_type": "time without time zone",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "bookings",
    "column_name": "return_date",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "bookings",
    "column_name": "return_time",
    "data_type": "time without time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "bookings",
    "column_name": "service_type",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "bookings",
    "column_name": "group_size",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "bookings",
    "column_name": "payment_method",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "bookings",
    "column_name": "total_amount",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "bookings",
    "column_name": "payment_status",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "bookings",
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "bookings",
    "column_name": "payment_session_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "bookings",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "bookings",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "bookings",
    "column_name": "pickup_option",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "'airport'::text"
  },
  {
    "table_name": "bookings",
    "column_name": "hotel_pickup",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "bookings",
    "column_name": "hotel_details",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "customers",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "customers",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "customers",
    "column_name": "first_name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "customers",
    "column_name": "last_name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "customers",
    "column_name": "mobile_number",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "customers",
    "column_name": "messenger_type",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "customers",
    "column_name": "messenger_contact",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "customers",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "customers",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "driver_application_drafts",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "driver_application_drafts",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_application_drafts",
    "column_name": "form_data",
    "data_type": "jsonb",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_application_drafts",
    "column_name": "current_step",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_application_drafts",
    "column_name": "last_updated",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())"
  },
  {
    "table_name": "driver_applications",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "driver_applications",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "driver_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "full_name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "email",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "mobile_number",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "address",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "license_number",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "license_expiration",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "license_type",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_make",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_model",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_year",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "plate_number",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "or_cr_number",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_color",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "insurance_provider",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "policy_number",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "policy_expiration",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "tnvs_number",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "cpc_number",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "bank_name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "account_number",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "account_holder",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "driver_license_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "or_cr_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "insurance_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_front_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_side_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_rear_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "nbi_clearance_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "medical_certificate_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "status",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "column_default": "'pending'::driver_application_status"
  },
  {
    "table_name": "driver_applications",
    "column_name": "notes",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "reviewed_by",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "reviewed_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "timezone('utc'::text, now())"
  },
  {
    "table_name": "driver_applications",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "timezone('utc'::text, now())"
  },
  {
    "table_name": "driver_applications",
    "column_name": "documents",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "driver_availability",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "driver_availability",
    "column_name": "driver_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "driver_availability",
    "column_name": "day_of_week",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_availability",
    "column_name": "time_slot",
    "data_type": "time without time zone",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_availability",
    "column_name": "location",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "driver_availability",
    "column_name": "is_available",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "true"
  },
  {
    "table_name": "driver_availability",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "driver_availability",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "drivers",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "drivers",
    "column_name": "name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "drivers",
    "column_name": "license_number",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "drivers",
    "column_name": "contact_number",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "drivers",
    "column_name": "emergency_contact",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "drivers",
    "column_name": "status",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "column_default": "'active'::driver_status"
  },
  {
    "table_name": "drivers",
    "column_name": "documents_verified",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_name": "drivers",
    "column_name": "license_expiry",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "drivers",
    "column_name": "notes",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "drivers",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "timezone('utc'::text, now())"
  },
  {
    "table_name": "drivers",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "timezone('utc'::text, now())"
  },
  {
    "table_name": "payments",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "payments",
    "column_name": "booking_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "amount",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "'pending'::text"
  },
  {
    "table_name": "payments",
    "column_name": "provider",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "provider_payment_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "provider_session_id",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "payments",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "payments",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "profiles",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "auth.uid()"
  },
  {
    "table_name": "profiles",
    "column_name": "full_name",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "profiles",
    "column_name": "mobile_number",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "profiles",
    "column_name": "date_of_birth",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "profiles",
    "column_name": "bio",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "profiles",
    "column_name": "avatar_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "profiles",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "profiles",
    "column_name": "role",
    "data_type": "character varying",
    "is_nullable": "YES",
    "column_default": "'user'::character varying"
  },
  {
    "table_name": "routes",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "routes",
    "column_name": "from_location",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "routes",
    "column_name": "to_location",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "routes",
    "column_name": "base_price",
    "data_type": "numeric",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "routes",
    "column_name": "estimated_duration",
    "data_type": "interval",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "routes",
    "column_name": "status",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "true"
  },
  {
    "table_name": "routes",
    "column_name": "description",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "routes",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "timezone('utc'::text, now())"
  },
  {
    "table_name": "routes",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "timezone('utc'::text, now())"
  },
  {
    "table_name": "staff_roles",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_name": "staff_roles",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "staff_roles",
    "column_name": "role",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "staff_roles",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "staff_roles",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_name": "staff_roles_old",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "staff_roles_old",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "staff_roles_old",
    "column_name": "role",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "staff_roles_old",
    "column_name": "permissions",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": "'{}'::jsonb"
  },
  {
    "table_name": "staff_roles_old",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "timezone('utc'::text, now())"
  },
  {
    "table_name": "staff_roles_old",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "timezone('utc'::text, now())"
  },
  {
    "table_name": "trip_assignments",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "trip_assignments",
    "column_name": "booking_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "trip_assignments",
    "column_name": "vehicle_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "trip_assignments",
    "column_name": "driver_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "trip_assignments",
    "column_name": "departure_time",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "trip_assignments",
    "column_name": "status",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "column_default": "'pending'::trip_status"
  },
  {
    "table_name": "trip_assignments",
    "column_name": "notes",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "trip_assignments",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "timezone('utc'::text, now())"
  },
  {
    "table_name": "trip_assignments",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "timezone('utc'::text, now())"
  },
  {
    "table_name": "users",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "users",
    "column_name": "first_name",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "users",
    "column_name": "last_name",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "users",
    "column_name": "phone",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "users",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())"
  },
  {
    "table_name": "users",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "timezone('utc'::text, now())"
  },
  {
    "table_name": "users",
    "column_name": "role",
    "data_type": "character varying",
    "is_nullable": "YES",
    "column_default": "'user'::character varying"
  },
  {
    "table_name": "vehicles",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()"
  },
  {
    "table_name": "vehicles",
    "column_name": "plate_number",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "vehicles",
    "column_name": "model",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "vehicles",
    "column_name": "capacity",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_name": "vehicles",
    "column_name": "status",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "column_default": "'active'::vehicle_status"
  },
  {
    "table_name": "vehicles",
    "column_name": "last_maintenance_date",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "vehicles",
    "column_name": "notes",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_name": "vehicles",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "timezone('utc'::text, now())"
  },
  {
    "table_name": "vehicles",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "timezone('utc'::text, now())"
  }
]
## 3. List Primary Key Restraints
[
  {
    "table_name": "admin_access",
    "column_name": "user_id"
  },
  {
    "table_name": "bookings",
    "column_name": "id"
  },
  {
    "table_name": "customers",
    "column_name": "id"
  },
  {
    "table_name": "driver_application_drafts",
    "column_name": "id"
  },
  {
    "table_name": "driver_applications",
    "column_name": "id"
  },
  {
    "table_name": "driver_availability",
    "column_name": "id"
  },
  {
    "table_name": "drivers",
    "column_name": "id"
  },
  {
    "table_name": "payments",
    "column_name": "id"
  },
  {
    "table_name": "profiles",
    "column_name": "id"
  },
  {
    "table_name": "routes",
    "column_name": "id"
  },
  {
    "table_name": "staff_roles",
    "column_name": "id"
  },
  {
    "table_name": "staff_roles_old",
    "column_name": "id"
  },
  {
    "table_name": "trip_assignments",
    "column_name": "id"
  },
  {
    "table_name": "users",
    "column_name": "id"
  },
  {
    "table_name": "users",
    "column_name": "id"
  },
  {
    "table_name": "vehicles",
    "column_name": "id"
  }
]

## 4. List Foreign Key Restraints
[
  {
    "table_name": "admin_access",
    "column_name": "user_id",
    "foreign_table": "users",
    "foreign_column": "id"
  },
  {
    "table_name": "bookings",
    "column_name": "user_id",
    "foreign_table": "users",
    "foreign_column": "id"
  },
  {
    "table_name": "bookings",
    "column_name": "customer_id",
    "foreign_table": "customers",
    "foreign_column": "id"
  },
  {
    "table_name": "customers",
    "column_name": "user_id",
    "foreign_table": "users",
    "foreign_column": "id"
  },
  {
    "table_name": "driver_application_drafts",
    "column_name": "user_id",
    "foreign_table": "users",
    "foreign_column": "id"
  },
  {
    "table_name": "driver_applications",
    "column_name": "user_id",
    "foreign_table": "users",
    "foreign_column": "id"
  },
  {
    "table_name": "driver_applications",
    "column_name": "reviewed_by",
    "foreign_table": "users",
    "foreign_column": "id"
  },
  {
    "table_name": "driver_applications",
    "column_name": "driver_id",
    "foreign_table": "drivers",
    "foreign_column": "id"
  },
  {
    "table_name": "driver_applications",
    "column_name": "reviewed_by",
    "foreign_table": "users",
    "foreign_column": "id"
  },
  {
    "table_name": "driver_applications",
    "column_name": "driver_id",
    "foreign_table": "users",
    "foreign_column": "id"
  },
  {
    "table_name": "driver_availability",
    "column_name": "driver_id",
    "foreign_table": "users",
    "foreign_column": "id"
  },
  {
    "table_name": "profiles",
    "column_name": "id",
    "foreign_table": "users",
    "foreign_column": "id"
  },
  {
    "table_name": "trip_assignments",
    "column_name": "vehicle_id",
    "foreign_table": "vehicles",
    "foreign_column": "id"
  },
  {
    "table_name": "trip_assignments",
    "column_name": "driver_id",
    "foreign_table": "drivers",
    "foreign_column": "id"
  },
  {
    "table_name": "trip_assignments",
    "column_name": "booking_id",
    "foreign_table": "bookings",
    "foreign_column": "id"
  },
  {
    "table_name": "users",
    "column_name": "id",
    "foreign_table": "users",
    "foreign_column": "id"
  }
]
## 5. List All Indexes
[
  {
    "schemaname": "public",
    "tablename": "admin_access",
    "indexname": "admin_access_pkey",
    "indexdef": "CREATE UNIQUE INDEX admin_access_pkey ON public.admin_access USING btree (user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "bookings",
    "indexname": "bookings_pkey",
    "indexdef": "CREATE UNIQUE INDEX bookings_pkey ON public.bookings USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "customers",
    "indexname": "customers_pkey",
    "indexdef": "CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_application_drafts",
    "indexname": "driver_application_drafts_pkey",
    "indexdef": "CREATE UNIQUE INDEX driver_application_drafts_pkey ON public.driver_application_drafts USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_application_drafts",
    "indexname": "driver_application_drafts_user_id_key",
    "indexdef": "CREATE UNIQUE INDEX driver_application_drafts_user_id_key ON public.driver_application_drafts USING btree (user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_applications",
    "indexname": "idx_driver_applications_status",
    "indexdef": "CREATE INDEX idx_driver_applications_status ON public.driver_applications USING btree (status)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_applications",
    "indexname": "idx_driver_applications_user_id",
    "indexdef": "CREATE INDEX idx_driver_applications_user_id ON public.driver_applications USING btree (user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_applications",
    "indexname": "driver_applications_pkey",
    "indexdef": "CREATE UNIQUE INDEX driver_applications_pkey ON public.driver_applications USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_availability",
    "indexname": "idx_driver_availability_composite",
    "indexdef": "CREATE INDEX idx_driver_availability_composite ON public.driver_availability USING btree (driver_id, day_of_week, time_slot)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_availability",
    "indexname": "driver_availability_pkey",
    "indexdef": "CREATE UNIQUE INDEX driver_availability_pkey ON public.driver_availability USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_availability",
    "indexname": "idx_driver_availability_driver",
    "indexdef": "CREATE INDEX idx_driver_availability_driver ON public.driver_availability USING btree (driver_id)"
  },
  {
    "schemaname": "public",
    "tablename": "driver_availability",
    "indexname": "idx_driver_availability_day",
    "indexdef": "CREATE INDEX idx_driver_availability_day ON public.driver_availability USING btree (day_of_week)"
  },
  {
    "schemaname": "public",
    "tablename": "drivers",
    "indexname": "drivers_license_number_key",
    "indexdef": "CREATE UNIQUE INDEX drivers_license_number_key ON public.drivers USING btree (license_number)"
  },
  {
    "schemaname": "public",
    "tablename": "drivers",
    "indexname": "drivers_pkey",
    "indexdef": "CREATE UNIQUE INDEX drivers_pkey ON public.drivers USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "payments",
    "indexname": "payments_pkey",
    "indexdef": "CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "indexname": "profiles_role_idx",
    "indexdef": "CREATE INDEX profiles_role_idx ON public.profiles USING btree (role)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "indexname": "profiles_pkey",
    "indexdef": "CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "routes",
    "indexname": "routes_pkey",
    "indexdef": "CREATE UNIQUE INDEX routes_pkey ON public.routes USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "routes",
    "indexname": "routes_from_location_to_location_key",
    "indexdef": "CREATE UNIQUE INDEX routes_from_location_to_location_key ON public.routes USING btree (from_location, to_location)"
  },
  {
    "schemaname": "public",
    "tablename": "staff_roles",
    "indexname": "staff_roles_new_pkey",
    "indexdef": "CREATE UNIQUE INDEX staff_roles_new_pkey ON public.staff_roles USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "staff_roles_old",
    "indexname": "staff_roles_pkey",
    "indexdef": "CREATE UNIQUE INDEX staff_roles_pkey ON public.staff_roles_old USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "staff_roles_old",
    "indexname": "staff_roles_user_id_key",
    "indexdef": "CREATE UNIQUE INDEX staff_roles_user_id_key ON public.staff_roles_old USING btree (user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "trip_assignments",
    "indexname": "trip_assignments_pkey",
    "indexdef": "CREATE UNIQUE INDEX trip_assignments_pkey ON public.trip_assignments USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "users",
    "indexname": "users_role_idx",
    "indexdef": "CREATE INDEX users_role_idx ON public.users USING btree (role)"
  },
  {
    "schemaname": "public",
    "tablename": "users",
    "indexname": "users_pkey",
    "indexdef": "CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "vehicles",
    "indexname": "vehicles_pkey",
    "indexdef": "CREATE UNIQUE INDEX vehicles_pkey ON public.vehicles USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "vehicles",
    "indexname": "vehicles_plate_number_key",
    "indexdef": "CREATE UNIQUE INDEX vehicles_plate_number_key ON public.vehicles USING btree (plate_number)"
  }
]

