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
    "table_name": "chat_messages"
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
[
  {
    "table_name": "admin_access",
    "column_name": "user_id",
    "ordinal_position": 1,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "admin_access",
    "column_name": "is_super_admin",
    "ordinal_position": 2,
    "column_default": "false",
    "is_nullable": "YES",
    "data_type": "boolean",
    "character_maximum_length": null
  },
  {
    "table_name": "admin_access",
    "column_name": "created_at",
    "ordinal_position": 3,
    "column_default": "timezone('utc'::text, now())",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "uuid_generate_v4()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "customer_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "user_id",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "from_location",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "to_location",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "departure_date",
    "ordinal_position": 6,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "date",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "departure_time",
    "ordinal_position": 7,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "time without time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "return_date",
    "ordinal_position": 8,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "date",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "return_time",
    "ordinal_position": 9,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "time without time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "service_type",
    "ordinal_position": 10,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "group_size",
    "ordinal_position": 11,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "integer",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "payment_method",
    "ordinal_position": 12,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "total_amount",
    "ordinal_position": 13,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "numeric",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "payment_status",
    "ordinal_position": 14,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "status",
    "ordinal_position": 15,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "payment_session_id",
    "ordinal_position": 16,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "created_at",
    "ordinal_position": 17,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "updated_at",
    "ordinal_position": 18,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "pickup_option",
    "ordinal_position": 19,
    "column_default": "'airport'::text",
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "hotel_pickup",
    "ordinal_position": 20,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "hotel_details",
    "ordinal_position": 21,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "jsonb",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "confirmation_email_sent",
    "ordinal_position": 22,
    "column_default": "false",
    "is_nullable": "YES",
    "data_type": "boolean",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "confirmation_email_sent_at",
    "ordinal_position": 23,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "driver_assignment_email_sent",
    "ordinal_position": 24,
    "column_default": "false",
    "is_nullable": "YES",
    "data_type": "boolean",
    "character_maximum_length": null
  },
  {
    "table_name": "bookings",
    "column_name": "driver_assignment_email_sent_at",
    "ordinal_position": 25,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "chat_messages",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "gen_random_uuid()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "chat_messages",
    "column_name": "user_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "chat_messages",
    "column_name": "type",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "chat_messages",
    "column_name": "content",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "chat_messages",
    "column_name": "booking_id",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "chat_messages",
    "column_name": "created_at",
    "ordinal_position": 6,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "chat_messages",
    "column_name": "metadata",
    "ordinal_position": 7,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "jsonb",
    "character_maximum_length": null
  },
  {
    "table_name": "customers",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "uuid_generate_v4()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "customers",
    "column_name": "user_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "customers",
    "column_name": "first_name",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "customers",
    "column_name": "last_name",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "customers",
    "column_name": "mobile_number",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "customers",
    "column_name": "messenger_type",
    "ordinal_position": 6,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "customers",
    "column_name": "messenger_contact",
    "ordinal_position": 7,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "customers",
    "column_name": "created_at",
    "ordinal_position": 8,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "customers",
    "column_name": "updated_at",
    "ordinal_position": 9,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_application_drafts",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "uuid_generate_v4()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_application_drafts",
    "column_name": "user_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_application_drafts",
    "column_name": "form_data",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "jsonb",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_application_drafts",
    "column_name": "current_step",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "integer",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_application_drafts",
    "column_name": "last_updated",
    "ordinal_position": 5,
    "column_default": "timezone('utc'::text, now())",
    "is_nullable": "NO",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "uuid_generate_v4()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "user_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "driver_id",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "full_name",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "email",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "mobile_number",
    "ordinal_position": 6,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "address",
    "ordinal_position": 7,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "license_number",
    "ordinal_position": 8,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "license_expiration",
    "ordinal_position": 9,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "date",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "license_type",
    "ordinal_position": 10,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_make",
    "ordinal_position": 11,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_model",
    "ordinal_position": 12,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_year",
    "ordinal_position": 13,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "integer",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "plate_number",
    "ordinal_position": 14,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "or_cr_number",
    "ordinal_position": 15,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_color",
    "ordinal_position": 16,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "insurance_provider",
    "ordinal_position": 17,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "policy_number",
    "ordinal_position": 18,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "policy_expiration",
    "ordinal_position": 19,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "date",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "tnvs_number",
    "ordinal_position": 20,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "cpc_number",
    "ordinal_position": 21,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "bank_name",
    "ordinal_position": 22,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "account_number",
    "ordinal_position": 23,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "account_holder",
    "ordinal_position": 24,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "driver_license_url",
    "ordinal_position": 25,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "or_cr_url",
    "ordinal_position": 26,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "insurance_url",
    "ordinal_position": 27,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_front_url",
    "ordinal_position": 28,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_side_url",
    "ordinal_position": 29,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_rear_url",
    "ordinal_position": 30,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "nbi_clearance_url",
    "ordinal_position": 31,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "medical_certificate_url",
    "ordinal_position": 32,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "status",
    "ordinal_position": 33,
    "column_default": "'pending'::driver_application_status",
    "is_nullable": "YES",
    "data_type": "USER-DEFINED",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "notes",
    "ordinal_position": 34,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "reviewed_by",
    "ordinal_position": 35,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "reviewed_at",
    "ordinal_position": 36,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "created_at",
    "ordinal_position": 37,
    "column_default": "timezone('utc'::text, now())",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "updated_at",
    "ordinal_position": 38,
    "column_default": "timezone('utc'::text, now())",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_applications",
    "column_name": "documents",
    "ordinal_position": 39,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "jsonb",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_availability",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "uuid_generate_v4()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_availability",
    "column_name": "driver_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_availability",
    "column_name": "day_of_week",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "integer",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_availability",
    "column_name": "time_slot",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "time without time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_availability",
    "column_name": "location",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_availability",
    "column_name": "is_available",
    "ordinal_position": 6,
    "column_default": "true",
    "is_nullable": "YES",
    "data_type": "boolean",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_availability",
    "column_name": "created_at",
    "ordinal_position": 7,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "driver_availability",
    "column_name": "updated_at",
    "ordinal_position": 8,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "drivers",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "uuid_generate_v4()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "drivers",
    "column_name": "name",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "drivers",
    "column_name": "license_number",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "drivers",
    "column_name": "contact_number",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "drivers",
    "column_name": "emergency_contact",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "drivers",
    "column_name": "status",
    "ordinal_position": 6,
    "column_default": "'active'::driver_status",
    "is_nullable": "YES",
    "data_type": "USER-DEFINED",
    "character_maximum_length": null
  },
  {
    "table_name": "drivers",
    "column_name": "documents_verified",
    "ordinal_position": 7,
    "column_default": "false",
    "is_nullable": "YES",
    "data_type": "boolean",
    "character_maximum_length": null
  },
  {
    "table_name": "drivers",
    "column_name": "license_expiry",
    "ordinal_position": 8,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "date",
    "character_maximum_length": null
  },
  {
    "table_name": "drivers",
    "column_name": "notes",
    "ordinal_position": 9,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "drivers",
    "column_name": "created_at",
    "ordinal_position": 10,
    "column_default": "timezone('utc'::text, now())",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "drivers",
    "column_name": "updated_at",
    "ordinal_position": 11,
    "column_default": "timezone('utc'::text, now())",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "payments",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "gen_random_uuid()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "payments",
    "column_name": "booking_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "payments",
    "column_name": "amount",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "numeric",
    "character_maximum_length": null
  },
  {
    "table_name": "payments",
    "column_name": "status",
    "ordinal_position": 4,
    "column_default": "'pending'::text",
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "payments",
    "column_name": "provider",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "payments",
    "column_name": "provider_payment_id",
    "ordinal_position": 6,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "payments",
    "column_name": "provider_session_id",
    "ordinal_position": 7,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "payments",
    "column_name": "created_at",
    "ordinal_position": 8,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "payments",
    "column_name": "updated_at",
    "ordinal_position": 9,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "profiles",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "auth.uid()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "profiles",
    "column_name": "full_name",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "profiles",
    "column_name": "mobile_number",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "profiles",
    "column_name": "date_of_birth",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "date",
    "character_maximum_length": null
  },
  {
    "table_name": "profiles",
    "column_name": "bio",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "profiles",
    "column_name": "avatar_url",
    "ordinal_position": 6,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "profiles",
    "column_name": "created_at",
    "ordinal_position": 7,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "profiles",
    "column_name": "role",
    "ordinal_position": 8,
    "column_default": "'user'::character varying",
    "is_nullable": "YES",
    "data_type": "character varying",
    "character_maximum_length": 255
  },
  {
    "table_name": "routes",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "uuid_generate_v4()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "routes",
    "column_name": "from_location",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "routes",
    "column_name": "to_location",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "routes",
    "column_name": "base_price",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "numeric",
    "character_maximum_length": null
  },
  {
    "table_name": "routes",
    "column_name": "estimated_duration",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "interval",
    "character_maximum_length": null
  },
  {
    "table_name": "routes",
    "column_name": "status",
    "ordinal_position": 6,
    "column_default": "true",
    "is_nullable": "YES",
    "data_type": "boolean",
    "character_maximum_length": null
  },
  {
    "table_name": "routes",
    "column_name": "description",
    "ordinal_position": 7,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "routes",
    "column_name": "created_at",
    "ordinal_position": 8,
    "column_default": "timezone('utc'::text, now())",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "routes",
    "column_name": "updated_at",
    "ordinal_position": 9,
    "column_default": "timezone('utc'::text, now())",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "staff_roles",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "gen_random_uuid()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "staff_roles",
    "column_name": "user_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "staff_roles",
    "column_name": "role",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "staff_roles",
    "column_name": "created_at",
    "ordinal_position": 4,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "staff_roles",
    "column_name": "updated_at",
    "ordinal_position": 5,
    "column_default": "now()",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "staff_roles_old",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "uuid_generate_v4()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "staff_roles_old",
    "column_name": "user_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "staff_roles_old",
    "column_name": "role",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "USER-DEFINED",
    "character_maximum_length": null
  },
  {
    "table_name": "staff_roles_old",
    "column_name": "permissions",
    "ordinal_position": 4,
    "column_default": "'{}'::jsonb",
    "is_nullable": "YES",
    "data_type": "jsonb",
    "character_maximum_length": null
  },
  {
    "table_name": "staff_roles_old",
    "column_name": "created_at",
    "ordinal_position": 5,
    "column_default": "timezone('utc'::text, now())",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "staff_roles_old",
    "column_name": "updated_at",
    "ordinal_position": 6,
    "column_default": "timezone('utc'::text, now())",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "trip_assignments",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "uuid_generate_v4()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "trip_assignments",
    "column_name": "booking_id",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "trip_assignments",
    "column_name": "vehicle_id",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "trip_assignments",
    "column_name": "driver_id",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "trip_assignments",
    "column_name": "departure_time",
    "ordinal_position": 5,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "trip_assignments",
    "column_name": "status",
    "ordinal_position": 6,
    "column_default": "'pending'::trip_status",
    "is_nullable": "YES",
    "data_type": "USER-DEFINED",
    "character_maximum_length": null
  },
  {
    "table_name": "trip_assignments",
    "column_name": "notes",
    "ordinal_position": 7,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "trip_assignments",
    "column_name": "created_at",
    "ordinal_position": 8,
    "column_default": "timezone('utc'::text, now())",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "trip_assignments",
    "column_name": "updated_at",
    "ordinal_position": 9,
    "column_default": "timezone('utc'::text, now())",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "users",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "users",
    "column_name": "first_name",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "users",
    "column_name": "last_name",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "users",
    "column_name": "phone",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "users",
    "column_name": "created_at",
    "ordinal_position": 5,
    "column_default": "timezone('utc'::text, now())",
    "is_nullable": "NO",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "users",
    "column_name": "updated_at",
    "ordinal_position": 6,
    "column_default": "timezone('utc'::text, now())",
    "is_nullable": "NO",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "users",
    "column_name": "role",
    "ordinal_position": 7,
    "column_default": "'user'::character varying",
    "is_nullable": "YES",
    "data_type": "character varying",
    "character_maximum_length": 255
  },
  {
    "table_name": "vehicles",
    "column_name": "id",
    "ordinal_position": 1,
    "column_default": "uuid_generate_v4()",
    "is_nullable": "NO",
    "data_type": "uuid",
    "character_maximum_length": null
  },
  {
    "table_name": "vehicles",
    "column_name": "plate_number",
    "ordinal_position": 2,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "vehicles",
    "column_name": "model",
    "ordinal_position": 3,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "vehicles",
    "column_name": "capacity",
    "ordinal_position": 4,
    "column_default": null,
    "is_nullable": "NO",
    "data_type": "integer",
    "character_maximum_length": null
  },
  {
    "table_name": "vehicles",
    "column_name": "status",
    "ordinal_position": 5,
    "column_default": "'active'::vehicle_status",
    "is_nullable": "YES",
    "data_type": "USER-DEFINED",
    "character_maximum_length": null
  },
  {
    "table_name": "vehicles",
    "column_name": "last_maintenance_date",
    "ordinal_position": 6,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "vehicles",
    "column_name": "notes",
    "ordinal_position": 7,
    "column_default": null,
    "is_nullable": "YES",
    "data_type": "text",
    "character_maximum_length": null
  },
  {
    "table_name": "vehicles",
    "column_name": "created_at",
    "ordinal_position": 8,
    "column_default": "timezone('utc'::text, now())",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  },
  {
    "table_name": "vehicles",
    "column_name": "updated_at",
    "ordinal_position": 9,
    "column_default": "timezone('utc'::text, now())",
    "is_nullable": "YES",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null
  }
]
[
  {
    "table_name": "admin_access",
    "constraint_name": "2200_47726_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "admin_access",
    "constraint_name": "admin_access_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "user_id",
    "foreign_table_name": "admin_access",
    "foreign_column_name": "user_id"
  },
  {
    "table_name": "admin_access",
    "constraint_name": "admin_access_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "user_id",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "bookings",
    "constraint_name": "2200_36179_10_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "bookings",
    "constraint_name": "2200_36179_11_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "bookings",
    "constraint_name": "2200_36179_12_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "bookings",
    "constraint_name": "2200_36179_13_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "bookings",
    "constraint_name": "2200_36179_14_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "bookings",
    "constraint_name": "2200_36179_15_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "bookings",
    "constraint_name": "2200_36179_19_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "bookings",
    "constraint_name": "2200_36179_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "bookings",
    "constraint_name": "2200_36179_4_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "bookings",
    "constraint_name": "2200_36179_5_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "bookings",
    "constraint_name": "2200_36179_6_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "bookings",
    "constraint_name": "2200_36179_7_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "bookings",
    "constraint_name": "bookings_customer_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "customer_id",
    "foreign_table_name": "customers",
    "foreign_column_name": "id"
  },
  {
    "table_name": "bookings",
    "constraint_name": "bookings_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "bookings",
    "foreign_column_name": "id"
  },
  {
    "table_name": "bookings",
    "constraint_name": "bookings_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "user_id",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "chat_messages",
    "constraint_name": "2200_63092_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "chat_messages",
    "constraint_name": "2200_63092_2_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "chat_messages",
    "constraint_name": "2200_63092_3_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "chat_messages",
    "constraint_name": "2200_63092_4_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "chat_messages",
    "constraint_name": "chat_messages_booking_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "booking_id",
    "foreign_table_name": "bookings",
    "foreign_column_name": "id"
  },
  {
    "table_name": "chat_messages",
    "constraint_name": "chat_messages_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "chat_messages",
    "foreign_column_name": "id"
  },
  {
    "table_name": "chat_messages",
    "constraint_name": "chat_messages_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "user_id",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "customers",
    "constraint_name": "2200_36164_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "customers",
    "constraint_name": "2200_36164_3_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "customers",
    "constraint_name": "2200_36164_4_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "customers",
    "constraint_name": "2200_36164_5_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "customers",
    "constraint_name": "2200_36164_6_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "customers",
    "constraint_name": "2200_36164_7_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "customers",
    "constraint_name": "customers_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "customers",
    "foreign_column_name": "id"
  },
  {
    "table_name": "customers",
    "constraint_name": "customers_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "user_id",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_application_drafts",
    "constraint_name": "2200_48146_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_application_drafts",
    "constraint_name": "2200_48146_2_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_application_drafts",
    "constraint_name": "2200_48146_3_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_application_drafts",
    "constraint_name": "2200_48146_4_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_application_drafts",
    "constraint_name": "2200_48146_5_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_application_drafts",
    "constraint_name": "driver_application_drafts_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "driver_application_drafts",
    "foreign_column_name": "id"
  },
  {
    "table_name": "driver_application_drafts",
    "constraint_name": "driver_application_drafts_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "user_id",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_application_drafts",
    "constraint_name": "driver_application_drafts_user_id_key",
    "constraint_type": "UNIQUE",
    "column_name": "user_id",
    "foreign_table_name": "driver_application_drafts",
    "foreign_column_name": "user_id"
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_10_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_11_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_12_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_13_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_14_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_15_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_16_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_17_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_18_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_19_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_22_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_23_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_24_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_4_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_5_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_6_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_7_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_8_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "2200_46983_9_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "driver_applications_driver_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "driver_id",
    "foreign_table_name": "drivers",
    "foreign_column_name": "id"
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "driver_applications_license_type_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "driver_applications",
    "foreign_column_name": "license_type"
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "driver_applications_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "driver_applications",
    "foreign_column_name": "id"
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "driver_applications_reviewed_by_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "reviewed_by",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "driver_applications_user_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "user_id",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "fk_driver_id",
    "constraint_type": "FOREIGN KEY",
    "column_name": "driver_id",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_applications",
    "constraint_name": "fk_reviewed_by",
    "constraint_type": "FOREIGN KEY",
    "column_name": "reviewed_by",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_availability",
    "constraint_name": "2200_50494_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_availability",
    "constraint_name": "2200_50494_3_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_availability",
    "constraint_name": "2200_50494_4_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_availability",
    "constraint_name": "2200_50494_5_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_availability",
    "constraint_name": "driver_availability_day_of_week_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "driver_availability",
    "foreign_column_name": "day_of_week"
  },
  {
    "table_name": "driver_availability",
    "constraint_name": "driver_availability_driver_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "driver_id",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "driver_availability",
    "constraint_name": "driver_availability_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "driver_availability",
    "foreign_column_name": "id"
  },
  {
    "table_name": "drivers",
    "constraint_name": "2200_32880_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "drivers",
    "constraint_name": "2200_32880_2_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "drivers",
    "constraint_name": "2200_32880_3_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "drivers",
    "constraint_name": "2200_32880_4_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "drivers",
    "constraint_name": "2200_32880_8_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "drivers",
    "constraint_name": "drivers_license_number_key",
    "constraint_type": "UNIQUE",
    "column_name": "license_number",
    "foreign_table_name": "drivers",
    "foreign_column_name": "license_number"
  },
  {
    "table_name": "drivers",
    "constraint_name": "drivers_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "drivers",
    "foreign_column_name": "id"
  },
  {
    "table_name": "payments",
    "constraint_name": "2200_29273_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "payments",
    "constraint_name": "2200_29273_3_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "payments",
    "constraint_name": "2200_29273_4_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "payments",
    "constraint_name": "2200_29273_5_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "payments",
    "constraint_name": "payments_amount_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "payments",
    "foreign_column_name": "amount"
  },
  {
    "table_name": "payments",
    "constraint_name": "payments_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "payments",
    "foreign_column_name": "id"
  },
  {
    "table_name": "payments",
    "constraint_name": "valid_status",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "payments",
    "foreign_column_name": "status"
  },
  {
    "table_name": "profiles",
    "constraint_name": "2200_30476_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "profiles",
    "constraint_name": "profiles_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "id",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "profiles",
    "constraint_name": "profiles_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "profiles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "routes",
    "constraint_name": "2200_32894_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "routes",
    "constraint_name": "2200_32894_2_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "routes",
    "constraint_name": "2200_32894_3_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "routes",
    "constraint_name": "2200_32894_4_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "routes",
    "constraint_name": "2200_32894_5_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "routes",
    "constraint_name": "routes_from_location_to_location_key",
    "constraint_type": "UNIQUE",
    "column_name": "to_location",
    "foreign_table_name": "routes",
    "foreign_column_name": "from_location"
  },
  {
    "table_name": "routes",
    "constraint_name": "routes_from_location_to_location_key",
    "constraint_type": "UNIQUE",
    "column_name": "to_location",
    "foreign_table_name": "routes",
    "foreign_column_name": "to_location"
  },
  {
    "table_name": "routes",
    "constraint_name": "routes_from_location_to_location_key",
    "constraint_type": "UNIQUE",
    "column_name": "from_location",
    "foreign_table_name": "routes",
    "foreign_column_name": "from_location"
  },
  {
    "table_name": "routes",
    "constraint_name": "routes_from_location_to_location_key",
    "constraint_type": "UNIQUE",
    "column_name": "from_location",
    "foreign_table_name": "routes",
    "foreign_column_name": "to_location"
  },
  {
    "table_name": "routes",
    "constraint_name": "routes_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "routes",
    "foreign_column_name": "id"
  },
  {
    "table_name": "staff_roles",
    "constraint_name": "2200_33366_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "staff_roles",
    "constraint_name": "2200_33366_2_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "staff_roles",
    "constraint_name": "2200_33366_3_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "staff_roles",
    "constraint_name": "staff_roles_new_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "staff_roles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "staff_roles",
    "constraint_name": "staff_roles_new_role_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "staff_roles",
    "foreign_column_name": "role"
  },
  {
    "table_name": "staff_roles",
    "constraint_name": "staff_roles_role_check",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "staff_roles",
    "foreign_column_name": "role"
  },
  {
    "table_name": "staff_roles_old",
    "constraint_name": "2200_32933_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "staff_roles_old",
    "constraint_name": "2200_32933_2_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "staff_roles_old",
    "constraint_name": "2200_32933_3_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "staff_roles_old",
    "constraint_name": "staff_roles_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "staff_roles_old",
    "foreign_column_name": "id"
  },
  {
    "table_name": "staff_roles_old",
    "constraint_name": "staff_roles_user_id_key",
    "constraint_type": "UNIQUE",
    "column_name": "user_id",
    "foreign_table_name": "staff_roles_old",
    "foreign_column_name": "user_id"
  },
  {
    "table_name": "trip_assignments",
    "constraint_name": "2200_32907_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "trip_assignments",
    "constraint_name": "2200_32907_5_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "trip_assignments",
    "constraint_name": "trip_assignments_booking_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "booking_id",
    "foreign_table_name": "bookings",
    "foreign_column_name": "id"
  },
  {
    "table_name": "trip_assignments",
    "constraint_name": "trip_assignments_driver_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "driver_id",
    "foreign_table_name": "drivers",
    "foreign_column_name": "id"
  },
  {
    "table_name": "trip_assignments",
    "constraint_name": "trip_assignments_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "trip_assignments",
    "foreign_column_name": "id"
  },
  {
    "table_name": "trip_assignments",
    "constraint_name": "trip_assignments_vehicle_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "vehicle_id",
    "foreign_table_name": "vehicles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "users",
    "constraint_name": "2200_35260_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "users",
    "constraint_name": "2200_35260_5_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "users",
    "constraint_name": "2200_35260_6_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "users",
    "constraint_name": "users_id_fkey",
    "constraint_type": "FOREIGN KEY",
    "column_name": "id",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "users",
    "constraint_name": "users_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "users",
    "foreign_column_name": "id"
  },
  {
    "table_name": "users",
    "constraint_name": "valid_roles",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": "users",
    "foreign_column_name": "role"
  },
  {
    "table_name": "vehicles",
    "constraint_name": "2200_32867_1_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "vehicles",
    "constraint_name": "2200_32867_2_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "vehicles",
    "constraint_name": "2200_32867_3_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "vehicles",
    "constraint_name": "2200_32867_4_not_null",
    "constraint_type": "CHECK",
    "column_name": null,
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "table_name": "vehicles",
    "constraint_name": "vehicles_pkey",
    "constraint_type": "PRIMARY KEY",
    "column_name": "id",
    "foreign_table_name": "vehicles",
    "foreign_column_name": "id"
  },
  {
    "table_name": "vehicles",
    "constraint_name": "vehicles_plate_number_key",
    "constraint_type": "UNIQUE",
    "column_name": "plate_number",
    "foreign_table_name": "vehicles",
    "foreign_column_name": "plate_number"
  }
]
[
  {
    "table_name": "_http_response",
    "index_name": "_http_response_created_idx",
    "index_definition": "CREATE INDEX _http_response_created_idx ON net._http_response USING btree (created)"
  },
  {
    "table_name": "admin_access",
    "index_name": "admin_access_pkey",
    "index_definition": "CREATE UNIQUE INDEX admin_access_pkey ON public.admin_access USING btree (user_id)"
  },
  {
    "table_name": "audit_log_entries",
    "index_name": "audit_log_entries_pkey",
    "index_definition": "CREATE UNIQUE INDEX audit_log_entries_pkey ON auth.audit_log_entries USING btree (id)"
  },
  {
    "table_name": "audit_log_entries",
    "index_name": "audit_logs_instance_id_idx",
    "index_definition": "CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id)"
  },
  {
    "table_name": "bookings",
    "index_name": "bookings_pkey",
    "index_definition": "CREATE UNIQUE INDEX bookings_pkey ON public.bookings USING btree (id)"
  },
  {
    "table_name": "buckets",
    "index_name": "bname",
    "index_definition": "CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name)"
  },
  {
    "table_name": "buckets",
    "index_name": "buckets_pkey",
    "index_definition": "CREATE UNIQUE INDEX buckets_pkey ON storage.buckets USING btree (id)"
  },
  {
    "table_name": "chat_messages",
    "index_name": "chat_messages_created_at_idx",
    "index_definition": "CREATE INDEX chat_messages_created_at_idx ON public.chat_messages USING btree (created_at)"
  },
  {
    "table_name": "chat_messages",
    "index_name": "chat_messages_pkey",
    "index_definition": "CREATE UNIQUE INDEX chat_messages_pkey ON public.chat_messages USING btree (id)"
  },
  {
    "table_name": "chat_messages",
    "index_name": "chat_messages_user_id_idx",
    "index_definition": "CREATE INDEX chat_messages_user_id_idx ON public.chat_messages USING btree (user_id)"
  },
  {
    "table_name": "customers",
    "index_name": "customers_pkey",
    "index_definition": "CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id)"
  },
  {
    "table_name": "driver_application_drafts",
    "index_name": "driver_application_drafts_pkey",
    "index_definition": "CREATE UNIQUE INDEX driver_application_drafts_pkey ON public.driver_application_drafts USING btree (id)"
  },
  {
    "table_name": "driver_application_drafts",
    "index_name": "driver_application_drafts_user_id_key",
    "index_definition": "CREATE UNIQUE INDEX driver_application_drafts_user_id_key ON public.driver_application_drafts USING btree (user_id)"
  },
  {
    "table_name": "driver_applications",
    "index_name": "driver_applications_pkey",
    "index_definition": "CREATE UNIQUE INDEX driver_applications_pkey ON public.driver_applications USING btree (id)"
  },
  {
    "table_name": "driver_applications",
    "index_name": "idx_driver_applications_status",
    "index_definition": "CREATE INDEX idx_driver_applications_status ON public.driver_applications USING btree (status)"
  },
  {
    "table_name": "driver_applications",
    "index_name": "idx_driver_applications_user_id",
    "index_definition": "CREATE INDEX idx_driver_applications_user_id ON public.driver_applications USING btree (user_id)"
  },
  {
    "table_name": "driver_availability",
    "index_name": "driver_availability_pkey",
    "index_definition": "CREATE UNIQUE INDEX driver_availability_pkey ON public.driver_availability USING btree (id)"
  },
  {
    "table_name": "driver_availability",
    "index_name": "idx_driver_availability_composite",
    "index_definition": "CREATE INDEX idx_driver_availability_composite ON public.driver_availability USING btree (driver_id, day_of_week, time_slot)"
  },
  {
    "table_name": "driver_availability",
    "index_name": "idx_driver_availability_day",
    "index_definition": "CREATE INDEX idx_driver_availability_day ON public.driver_availability USING btree (day_of_week)"
  },
  {
    "table_name": "driver_availability",
    "index_name": "idx_driver_availability_driver",
    "index_definition": "CREATE INDEX idx_driver_availability_driver ON public.driver_availability USING btree (driver_id)"
  },
  {
    "table_name": "drivers",
    "index_name": "drivers_license_number_key",
    "index_definition": "CREATE UNIQUE INDEX drivers_license_number_key ON public.drivers USING btree (license_number)"
  },
  {
    "table_name": "drivers",
    "index_name": "drivers_pkey",
    "index_definition": "CREATE UNIQUE INDEX drivers_pkey ON public.drivers USING btree (id)"
  },
  {
    "table_name": "flow_state",
    "index_name": "flow_state_created_at_idx",
    "index_definition": "CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC)"
  },
  {
    "table_name": "flow_state",
    "index_name": "flow_state_pkey",
    "index_definition": "CREATE UNIQUE INDEX flow_state_pkey ON auth.flow_state USING btree (id)"
  },
  {
    "table_name": "flow_state",
    "index_name": "idx_auth_code",
    "index_definition": "CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code)"
  },
  {
    "table_name": "flow_state",
    "index_name": "idx_user_id_auth_method",
    "index_definition": "CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method)"
  },
  {
    "table_name": "hooks",
    "index_name": "hooks_pkey",
    "index_definition": "CREATE UNIQUE INDEX hooks_pkey ON supabase_functions.hooks USING btree (id)"
  },
  {
    "table_name": "hooks",
    "index_name": "supabase_functions_hooks_h_table_id_h_name_idx",
    "index_definition": "CREATE INDEX supabase_functions_hooks_h_table_id_h_name_idx ON supabase_functions.hooks USING btree (hook_table_id, hook_name)"
  },
  {
    "table_name": "hooks",
    "index_name": "supabase_functions_hooks_request_id_idx",
    "index_definition": "CREATE INDEX supabase_functions_hooks_request_id_idx ON supabase_functions.hooks USING btree (request_id)"
  },
  {
    "table_name": "identities",
    "index_name": "identities_email_idx",
    "index_definition": "CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops)"
  },
  {
    "table_name": "identities",
    "index_name": "identities_pkey",
    "index_definition": "CREATE UNIQUE INDEX identities_pkey ON auth.identities USING btree (id)"
  },
  {
    "table_name": "identities",
    "index_name": "identities_provider_id_provider_unique",
    "index_definition": "CREATE UNIQUE INDEX identities_provider_id_provider_unique ON auth.identities USING btree (provider_id, provider)"
  },
  {
    "table_name": "identities",
    "index_name": "identities_user_id_idx",
    "index_definition": "CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id)"
  },
  {
    "table_name": "instances",
    "index_name": "instances_pkey",
    "index_definition": "CREATE UNIQUE INDEX instances_pkey ON auth.instances USING btree (id)"
  },
  {
    "table_name": "key",
    "index_name": "key_key_id_key_context_key_type_idx",
    "index_definition": "CREATE UNIQUE INDEX key_key_id_key_context_key_type_idx ON pgsodium.key USING btree (key_id, key_context, key_type)"
  },
  {
    "table_name": "key",
    "index_name": "key_pkey",
    "index_definition": "CREATE UNIQUE INDEX key_pkey ON pgsodium.key USING btree (id)"
  },
  {
    "table_name": "key",
    "index_name": "key_status_idx",
    "index_definition": "CREATE INDEX key_status_idx ON pgsodium.key USING btree (status) WHERE (status = ANY (ARRAY['valid'::pgsodium.key_status, 'default'::pgsodium.key_status]))"
  },
  {
    "table_name": "key",
    "index_name": "key_status_idx1",
    "index_definition": "CREATE UNIQUE INDEX key_status_idx1 ON pgsodium.key USING btree (status) WHERE (status = 'default'::pgsodium.key_status)"
  },
  {
    "table_name": "key",
    "index_name": "pgsodium_key_unique_name",
    "index_definition": "CREATE UNIQUE INDEX pgsodium_key_unique_name ON pgsodium.key USING btree (name)"
  },
  {
    "table_name": "messages_2025_02_03",
    "index_name": "messages_2025_02_03_pkey",
    "index_definition": "CREATE UNIQUE INDEX messages_2025_02_03_pkey ON realtime.messages_2025_02_03 USING btree (id, inserted_at)"
  },
  {
    "table_name": "messages_2025_02_04",
    "index_name": "messages_2025_02_04_pkey",
    "index_definition": "CREATE UNIQUE INDEX messages_2025_02_04_pkey ON realtime.messages_2025_02_04 USING btree (id, inserted_at)"
  },
  {
    "table_name": "messages_2025_02_05",
    "index_name": "messages_2025_02_05_pkey",
    "index_definition": "CREATE UNIQUE INDEX messages_2025_02_05_pkey ON realtime.messages_2025_02_05 USING btree (id, inserted_at)"
  },
  {
    "table_name": "messages_2025_02_06",
    "index_name": "messages_2025_02_06_pkey",
    "index_definition": "CREATE UNIQUE INDEX messages_2025_02_06_pkey ON realtime.messages_2025_02_06 USING btree (id, inserted_at)"
  },
  {
    "table_name": "messages_2025_02_07",
    "index_name": "messages_2025_02_07_pkey",
    "index_definition": "CREATE UNIQUE INDEX messages_2025_02_07_pkey ON realtime.messages_2025_02_07 USING btree (id, inserted_at)"
  },
  {
    "table_name": "messages_2025_02_08",
    "index_name": "messages_2025_02_08_pkey",
    "index_definition": "CREATE UNIQUE INDEX messages_2025_02_08_pkey ON realtime.messages_2025_02_08 USING btree (id, inserted_at)"
  },
  {
    "table_name": "mfa_amr_claims",
    "index_name": "amr_id_pk",
    "index_definition": "CREATE UNIQUE INDEX amr_id_pk ON auth.mfa_amr_claims USING btree (id)"
  },
  {
    "table_name": "mfa_amr_claims",
    "index_name": "mfa_amr_claims_session_id_authentication_method_pkey",
    "index_definition": "CREATE UNIQUE INDEX mfa_amr_claims_session_id_authentication_method_pkey ON auth.mfa_amr_claims USING btree (session_id, authentication_method)"
  },
  {
    "table_name": "mfa_challenges",
    "index_name": "mfa_challenge_created_at_idx",
    "index_definition": "CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC)"
  },
  {
    "table_name": "mfa_challenges",
    "index_name": "mfa_challenges_pkey",
    "index_definition": "CREATE UNIQUE INDEX mfa_challenges_pkey ON auth.mfa_challenges USING btree (id)"
  },
  {
    "table_name": "mfa_factors",
    "index_name": "factor_id_created_at_idx",
    "index_definition": "CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at)"
  },
  {
    "table_name": "mfa_factors",
    "index_name": "mfa_factors_last_challenged_at_key",
    "index_definition": "CREATE UNIQUE INDEX mfa_factors_last_challenged_at_key ON auth.mfa_factors USING btree (last_challenged_at)"
  },
  {
    "table_name": "mfa_factors",
    "index_name": "mfa_factors_pkey",
    "index_definition": "CREATE UNIQUE INDEX mfa_factors_pkey ON auth.mfa_factors USING btree (id)"
  },
  {
    "table_name": "mfa_factors",
    "index_name": "mfa_factors_user_friendly_name_unique",
    "index_definition": "CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text)"
  },
  {
    "table_name": "mfa_factors",
    "index_name": "mfa_factors_user_id_idx",
    "index_definition": "CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id)"
  },
  {
    "table_name": "mfa_factors",
    "index_name": "unique_phone_factor_per_user",
    "index_definition": "CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone)"
  },
  {
    "table_name": "migrations",
    "index_name": "migrations_name_key",
    "index_definition": "CREATE UNIQUE INDEX migrations_name_key ON storage.migrations USING btree (name)"
  },
  {
    "table_name": "migrations",
    "index_name": "migrations_pkey",
    "index_definition": "CREATE UNIQUE INDEX migrations_pkey ON storage.migrations USING btree (id)"
  },
  {
    "table_name": "migrations",
    "index_name": "migrations_pkey",
    "index_definition": "CREATE UNIQUE INDEX migrations_pkey ON supabase_functions.migrations USING btree (version)"
  },
  {
    "table_name": "objects",
    "index_name": "bucketid_objname",
    "index_definition": "CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name)"
  },
  {
    "table_name": "objects",
    "index_name": "idx_objects_bucket_id_name",
    "index_definition": "CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE \"C\")"
  },
  {
    "table_name": "objects",
    "index_name": "name_prefix_search",
    "index_definition": "CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops)"
  },
  {
    "table_name": "objects",
    "index_name": "objects_pkey",
    "index_definition": "CREATE UNIQUE INDEX objects_pkey ON storage.objects USING btree (id)"
  },
  {
    "table_name": "one_time_tokens",
    "index_name": "one_time_tokens_pkey",
    "index_definition": "CREATE UNIQUE INDEX one_time_tokens_pkey ON auth.one_time_tokens USING btree (id)"
  },
  {
    "table_name": "one_time_tokens",
    "index_name": "one_time_tokens_relates_to_hash_idx",
    "index_definition": "CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to)"
  },
  {
    "table_name": "one_time_tokens",
    "index_name": "one_time_tokens_token_hash_hash_idx",
    "index_definition": "CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash)"
  },
  {
    "table_name": "one_time_tokens",
    "index_name": "one_time_tokens_user_id_token_type_key",
    "index_definition": "CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type)"
  },
  {
    "table_name": "payments",
    "index_name": "payments_pkey",
    "index_definition": "CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id)"
  },
  {
    "table_name": "profiles",
    "index_name": "profiles_pkey",
    "index_definition": "CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)"
  },
  {
    "table_name": "profiles",
    "index_name": "profiles_role_idx",
    "index_definition": "CREATE INDEX profiles_role_idx ON public.profiles USING btree (role)"
  },
  {
    "table_name": "refresh_tokens",
    "index_name": "refresh_tokens_instance_id_idx",
    "index_definition": "CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id)"
  },
  {
    "table_name": "refresh_tokens",
    "index_name": "refresh_tokens_instance_id_user_id_idx",
    "index_definition": "CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id)"
  },
  {
    "table_name": "refresh_tokens",
    "index_name": "refresh_tokens_parent_idx",
    "index_definition": "CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent)"
  },
  {
    "table_name": "refresh_tokens",
    "index_name": "refresh_tokens_pkey",
    "index_definition": "CREATE UNIQUE INDEX refresh_tokens_pkey ON auth.refresh_tokens USING btree (id)"
  },
  {
    "table_name": "refresh_tokens",
    "index_name": "refresh_tokens_session_id_revoked_idx",
    "index_definition": "CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked)"
  },
  {
    "table_name": "refresh_tokens",
    "index_name": "refresh_tokens_token_unique",
    "index_definition": "CREATE UNIQUE INDEX refresh_tokens_token_unique ON auth.refresh_tokens USING btree (token)"
  },
  {
    "table_name": "refresh_tokens",
    "index_name": "refresh_tokens_updated_at_idx",
    "index_definition": "CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC)"
  },
  {
    "table_name": "routes",
    "index_name": "routes_from_location_to_location_key",
    "index_definition": "CREATE UNIQUE INDEX routes_from_location_to_location_key ON public.routes USING btree (from_location, to_location)"
  },
  {
    "table_name": "routes",
    "index_name": "routes_pkey",
    "index_definition": "CREATE UNIQUE INDEX routes_pkey ON public.routes USING btree (id)"
  },
  {
    "table_name": "s3_multipart_uploads",
    "index_name": "idx_multipart_uploads_list",
    "index_definition": "CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at)"
  },
  {
    "table_name": "s3_multipart_uploads",
    "index_name": "s3_multipart_uploads_pkey",
    "index_definition": "CREATE UNIQUE INDEX s3_multipart_uploads_pkey ON storage.s3_multipart_uploads USING btree (id)"
  },
  {
    "table_name": "s3_multipart_uploads_parts",
    "index_name": "s3_multipart_uploads_parts_pkey",
    "index_definition": "CREATE UNIQUE INDEX s3_multipart_uploads_parts_pkey ON storage.s3_multipart_uploads_parts USING btree (id)"
  },
  {
    "table_name": "saml_providers",
    "index_name": "saml_providers_entity_id_key",
    "index_definition": "CREATE UNIQUE INDEX saml_providers_entity_id_key ON auth.saml_providers USING btree (entity_id)"
  },
  {
    "table_name": "saml_providers",
    "index_name": "saml_providers_pkey",
    "index_definition": "CREATE UNIQUE INDEX saml_providers_pkey ON auth.saml_providers USING btree (id)"
  },
  {
    "table_name": "saml_providers",
    "index_name": "saml_providers_sso_provider_id_idx",
    "index_definition": "CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id)"
  },
  {
    "table_name": "saml_relay_states",
    "index_name": "saml_relay_states_created_at_idx",
    "index_definition": "CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC)"
  },
  {
    "table_name": "saml_relay_states",
    "index_name": "saml_relay_states_for_email_idx",
    "index_definition": "CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email)"
  },
  {
    "table_name": "saml_relay_states",
    "index_name": "saml_relay_states_pkey",
    "index_definition": "CREATE UNIQUE INDEX saml_relay_states_pkey ON auth.saml_relay_states USING btree (id)"
  },
  {
    "table_name": "saml_relay_states",
    "index_name": "saml_relay_states_sso_provider_id_idx",
    "index_definition": "CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id)"
  },
  {
    "table_name": "schema_migrations",
    "index_name": "schema_migrations_pkey",
    "index_definition": "CREATE UNIQUE INDEX schema_migrations_pkey ON realtime.schema_migrations USING btree (version)"
  },
  {
    "table_name": "schema_migrations",
    "index_name": "schema_migrations_pkey",
    "index_definition": "CREATE UNIQUE INDEX schema_migrations_pkey ON supabase_migrations.schema_migrations USING btree (version)"
  },
  {
    "table_name": "schema_migrations",
    "index_name": "schema_migrations_pkey",
    "index_definition": "CREATE UNIQUE INDEX schema_migrations_pkey ON auth.schema_migrations USING btree (version)"
  },
  {
    "table_name": "secrets",
    "index_name": "secrets_name_idx",
    "index_definition": "CREATE UNIQUE INDEX secrets_name_idx ON vault.secrets USING btree (name) WHERE (name IS NOT NULL)"
  },
  {
    "table_name": "secrets",
    "index_name": "secrets_pkey",
    "index_definition": "CREATE UNIQUE INDEX secrets_pkey ON vault.secrets USING btree (id)"
  },
  {
    "table_name": "seed_files",
    "index_name": "seed_files_pkey",
    "index_definition": "CREATE UNIQUE INDEX seed_files_pkey ON supabase_migrations.seed_files USING btree (path)"
  },
  {
    "table_name": "sessions",
    "index_name": "sessions_not_after_idx",
    "index_definition": "CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC)"
  },
  {
    "table_name": "sessions",
    "index_name": "sessions_pkey",
    "index_definition": "CREATE UNIQUE INDEX sessions_pkey ON auth.sessions USING btree (id)"
  },
  {
    "table_name": "sessions",
    "index_name": "sessions_user_id_idx",
    "index_definition": "CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id)"
  },
  {
    "table_name": "sessions",
    "index_name": "user_id_created_at_idx",
    "index_definition": "CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at)"
  },
  {
    "table_name": "sso_domains",
    "index_name": "sso_domains_domain_idx",
    "index_definition": "CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain))"
  },
  {
    "table_name": "sso_domains",
    "index_name": "sso_domains_pkey",
    "index_definition": "CREATE UNIQUE INDEX sso_domains_pkey ON auth.sso_domains USING btree (id)"
  },
  {
    "table_name": "sso_domains",
    "index_name": "sso_domains_sso_provider_id_idx",
    "index_definition": "CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id)"
  },
  {
    "table_name": "sso_providers",
    "index_name": "sso_providers_pkey",
    "index_definition": "CREATE UNIQUE INDEX sso_providers_pkey ON auth.sso_providers USING btree (id)"
  },
  {
    "table_name": "sso_providers",
    "index_name": "sso_providers_resource_id_idx",
    "index_definition": "CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id))"
  },
  {
    "table_name": "staff_roles",
    "index_name": "staff_roles_new_pkey",
    "index_definition": "CREATE UNIQUE INDEX staff_roles_new_pkey ON public.staff_roles USING btree (id)"
  },
  {
    "table_name": "staff_roles_old",
    "index_name": "staff_roles_pkey",
    "index_definition": "CREATE UNIQUE INDEX staff_roles_pkey ON public.staff_roles_old USING btree (id)"
  },
  {
    "table_name": "staff_roles_old",
    "index_name": "staff_roles_user_id_key",
    "index_definition": "CREATE UNIQUE INDEX staff_roles_user_id_key ON public.staff_roles_old USING btree (user_id)"
  },
  {
    "table_name": "subscription",
    "index_name": "ix_realtime_subscription_entity",
    "index_definition": "CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity)"
  },
  {
    "table_name": "subscription",
    "index_name": "pk_subscription",
    "index_definition": "CREATE UNIQUE INDEX pk_subscription ON realtime.subscription USING btree (id)"
  },
  {
    "table_name": "subscription",
    "index_name": "subscription_subscription_id_entity_filters_key",
    "index_definition": "CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters)"
  },
  {
    "table_name": "trip_assignments",
    "index_name": "trip_assignments_pkey",
    "index_definition": "CREATE UNIQUE INDEX trip_assignments_pkey ON public.trip_assignments USING btree (id)"
  },
  {
    "table_name": "users",
    "index_name": "confirmation_token_idx",
    "index_definition": "CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text)"
  },
  {
    "table_name": "users",
    "index_name": "email_change_token_current_idx",
    "index_definition": "CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text)"
  },
  {
    "table_name": "users",
    "index_name": "email_change_token_new_idx",
    "index_definition": "CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text)"
  },
  {
    "table_name": "users",
    "index_name": "reauthentication_token_idx",
    "index_definition": "CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text)"
  },
  {
    "table_name": "users",
    "index_name": "recovery_token_idx",
    "index_definition": "CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text)"
  },
  {
    "table_name": "users",
    "index_name": "users_email_partial_key",
    "index_definition": "CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false)"
  },
  {
    "table_name": "users",
    "index_name": "users_instance_id_email_idx",
    "index_definition": "CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text))"
  },
  {
    "table_name": "users",
    "index_name": "users_instance_id_idx",
    "index_definition": "CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id)"
  },
  {
    "table_name": "users",
    "index_name": "users_is_anonymous_idx",
    "index_definition": "CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous)"
  },
  {
    "table_name": "users",
    "index_name": "users_phone_key",
    "index_definition": "CREATE UNIQUE INDEX users_phone_key ON auth.users USING btree (phone)"
  },
  {
    "table_name": "users",
    "index_name": "users_pkey",
    "index_definition": "CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)"
  },
  {
    "table_name": "users",
    "index_name": "users_pkey",
    "index_definition": "CREATE UNIQUE INDEX users_pkey ON auth.users USING btree (id)"
  },
  {
    "table_name": "users",
    "index_name": "users_role_idx",
    "index_definition": "CREATE INDEX users_role_idx ON public.users USING btree (role)"
  },
  {
    "table_name": "vehicles",
    "index_name": "vehicles_pkey",
    "index_definition": "CREATE UNIQUE INDEX vehicles_pkey ON public.vehicles USING btree (id)"
  },
  {
    "table_name": "vehicles",
    "index_name": "vehicles_plate_number_key",
    "index_definition": "CREATE UNIQUE INDEX vehicles_plate_number_key ON public.vehicles USING btree (plate_number)"
  }
]
