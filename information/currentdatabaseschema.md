## Database Schema Reference
[
  {
    "table_name": "admin_access",
    "column_name": "user_id",
    "data_type": "uuid"
  },
  {
    "table_name": "admin_access",
    "column_name": "is_super_admin",
    "data_type": "boolean"
  },
  {
    "table_name": "admin_access",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "bookings",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "bookings",
    "column_name": "customer_id",
    "data_type": "uuid"
  },
  {
    "table_name": "bookings",
    "column_name": "user_id",
    "data_type": "uuid"
  },
  {
    "table_name": "bookings",
    "column_name": "from_location",
    "data_type": "text"
  },
  {
    "table_name": "bookings",
    "column_name": "to_location",
    "data_type": "text"
  },
  {
    "table_name": "bookings",
    "column_name": "departure_date",
    "data_type": "date"
  },
  {
    "table_name": "bookings",
    "column_name": "departure_time",
    "data_type": "time without time zone"
  },
  {
    "table_name": "bookings",
    "column_name": "return_date",
    "data_type": "date"
  },
  {
    "table_name": "bookings",
    "column_name": "return_time",
    "data_type": "time without time zone"
  },
  {
    "table_name": "bookings",
    "column_name": "service_type",
    "data_type": "text"
  },
  {
    "table_name": "bookings",
    "column_name": "group_size",
    "data_type": "integer"
  },
  {
    "table_name": "bookings",
    "column_name": "payment_method",
    "data_type": "text"
  },
  {
    "table_name": "bookings",
    "column_name": "total_amount",
    "data_type": "numeric"
  },
  {
    "table_name": "bookings",
    "column_name": "payment_status",
    "data_type": "text"
  },
  {
    "table_name": "bookings",
    "column_name": "status",
    "data_type": "text"
  },
  {
    "table_name": "bookings",
    "column_name": "payment_session_id",
    "data_type": "text"
  },
  {
    "table_name": "bookings",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "bookings",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "bookings",
    "column_name": "pickup_option",
    "data_type": "text"
  },
  {
    "table_name": "bookings",
    "column_name": "hotel_pickup",
    "data_type": "text"
  },
  {
    "table_name": "bookings",
    "column_name": "hotel_details",
    "data_type": "jsonb"
  },
  {
    "table_name": "bookings",
    "column_name": "confirmation_email_sent",
    "data_type": "boolean"
  },
  {
    "table_name": "bookings",
    "column_name": "confirmation_email_sent_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "bookings",
    "column_name": "driver_assignment_email_sent",
    "data_type": "boolean"
  },
  {
    "table_name": "bookings",
    "column_name": "driver_assignment_email_sent_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "bookings",
    "column_name": "driver_notification_sent",
    "data_type": "boolean"
  },
  {
    "table_name": "bookings",
    "column_name": "driver_notification_sent_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "bookings",
    "column_name": "driver_notification_attempted",
    "data_type": "boolean"
  },
  {
    "table_name": "bookings",
    "column_name": "driver_notification_attempted_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "bookings",
    "column_name": "driver_notification_success",
    "data_type": "boolean"
  },
  {
    "table_name": "chat_messages",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "chat_messages",
    "column_name": "user_id",
    "data_type": "uuid"
  },
  {
    "table_name": "chat_messages",
    "column_name": "type",
    "data_type": "text"
  },
  {
    "table_name": "chat_messages",
    "column_name": "content",
    "data_type": "text"
  },
  {
    "table_name": "chat_messages",
    "column_name": "booking_id",
    "data_type": "uuid"
  },
  {
    "table_name": "chat_messages",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "chat_messages",
    "column_name": "metadata",
    "data_type": "jsonb"
  },
  {
    "table_name": "customers",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "customers",
    "column_name": "user_id",
    "data_type": "uuid"
  },
  {
    "table_name": "customers",
    "column_name": "first_name",
    "data_type": "text"
  },
  {
    "table_name": "customers",
    "column_name": "last_name",
    "data_type": "text"
  },
  {
    "table_name": "customers",
    "column_name": "mobile_number",
    "data_type": "text"
  },
  {
    "table_name": "customers",
    "column_name": "messenger_type",
    "data_type": "text"
  },
  {
    "table_name": "customers",
    "column_name": "messenger_contact",
    "data_type": "text"
  },
  {
    "table_name": "customers",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "customers",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "customers",
    "column_name": "email",
    "data_type": "text"
  },
  {
    "table_name": "driver_application_drafts",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "driver_application_drafts",
    "column_name": "user_id",
    "data_type": "uuid"
  },
  {
    "table_name": "driver_application_drafts",
    "column_name": "form_data",
    "data_type": "jsonb"
  },
  {
    "table_name": "driver_application_drafts",
    "column_name": "current_step",
    "data_type": "integer"
  },
  {
    "table_name": "driver_application_drafts",
    "column_name": "last_updated",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "driver_applications",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "driver_applications",
    "column_name": "user_id",
    "data_type": "uuid"
  },
  {
    "table_name": "driver_applications",
    "column_name": "driver_id",
    "data_type": "uuid"
  },
  {
    "table_name": "driver_applications",
    "column_name": "full_name",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "email",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "mobile_number",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "address",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "license_number",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "license_expiration",
    "data_type": "date"
  },
  {
    "table_name": "driver_applications",
    "column_name": "license_type",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_make",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_model",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_year",
    "data_type": "integer"
  },
  {
    "table_name": "driver_applications",
    "column_name": "plate_number",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "or_cr_number",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_color",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "insurance_provider",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "policy_number",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "policy_expiration",
    "data_type": "date"
  },
  {
    "table_name": "driver_applications",
    "column_name": "tnvs_number",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "cpc_number",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "bank_name",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "account_number",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "account_holder",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "driver_license_url",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "or_cr_url",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "insurance_url",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_front_url",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_side_url",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "vehicle_rear_url",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "nbi_clearance_url",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "medical_certificate_url",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "status",
    "data_type": "USER-DEFINED"
  },
  {
    "table_name": "driver_applications",
    "column_name": "notes",
    "data_type": "text"
  },
  {
    "table_name": "driver_applications",
    "column_name": "reviewed_by",
    "data_type": "uuid"
  },
  {
    "table_name": "driver_applications",
    "column_name": "reviewed_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "driver_applications",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "driver_applications",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "driver_applications",
    "column_name": "documents",
    "data_type": "jsonb"
  },
  {
    "table_name": "driver_applications",
    "column_name": "terms_accepted",
    "data_type": "boolean"
  },
  {
    "table_name": "driver_applications",
    "column_name": "privacy_accepted",
    "data_type": "boolean"
  },
  {
    "table_name": "driver_assignments",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "driver_assignments",
    "column_name": "booking_id",
    "data_type": "uuid"
  },
  {
    "table_name": "driver_assignments",
    "column_name": "driver_id",
    "data_type": "uuid"
  },
  {
    "table_name": "driver_assignments",
    "column_name": "status",
    "data_type": "text"
  },
  {
    "table_name": "driver_assignments",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "driver_assignments",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "driver_availability",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "driver_availability",
    "column_name": "driver_id",
    "data_type": "uuid"
  },
  {
    "table_name": "driver_availability",
    "column_name": "day_of_week",
    "data_type": "integer"
  },
  {
    "table_name": "driver_availability",
    "column_name": "time_slot",
    "data_type": "time without time zone"
  },
  {
    "table_name": "driver_availability",
    "column_name": "location",
    "data_type": "text"
  },
  {
    "table_name": "driver_availability",
    "column_name": "is_available",
    "data_type": "boolean"
  },
  {
    "table_name": "driver_availability",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "driver_availability",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "driver_notification_logs",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "driver_notification_logs",
    "column_name": "booking_id",
    "data_type": "uuid"
  },
  {
    "table_name": "driver_notification_logs",
    "column_name": "status_code",
    "data_type": "integer"
  },
  {
    "table_name": "driver_notification_logs",
    "column_name": "response",
    "data_type": "text"
  },
  {
    "table_name": "driver_notification_logs",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "driver_notifications",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "driver_notifications",
    "column_name": "driver_id",
    "data_type": "uuid"
  },
  {
    "table_name": "driver_notifications",
    "column_name": "booking_id",
    "data_type": "uuid"
  },
  {
    "table_name": "driver_notifications",
    "column_name": "status",
    "data_type": "text"
  },
  {
    "table_name": "driver_notifications",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "driver_notifications",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "drivers",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "drivers",
    "column_name": "name",
    "data_type": "text"
  },
  {
    "table_name": "drivers",
    "column_name": "license_number",
    "data_type": "text"
  },
  {
    "table_name": "drivers",
    "column_name": "contact_number",
    "data_type": "text"
  },
  {
    "table_name": "drivers",
    "column_name": "emergency_contact",
    "data_type": "text"
  },
  {
    "table_name": "drivers",
    "column_name": "status",
    "data_type": "USER-DEFINED"
  },
  {
    "table_name": "drivers",
    "column_name": "documents_verified",
    "data_type": "boolean"
  },
  {
    "table_name": "drivers",
    "column_name": "license_expiry",
    "data_type": "date"
  },
  {
    "table_name": "drivers",
    "column_name": "notes",
    "data_type": "text"
  },
  {
    "table_name": "drivers",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "drivers",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "drivers",
    "column_name": "mobile_number",
    "data_type": "text"
  },
  {
    "table_name": "drivers",
    "column_name": "service_types",
    "data_type": "ARRAY"
  },
  {
    "table_name": "drivers",
    "column_name": "current_location",
    "data_type": "text"
  },
  {
    "table_name": "drivers",
    "column_name": "current_booking_id",
    "data_type": "uuid"
  },
  {
    "table_name": "drivers",
    "column_name": "is_available",
    "data_type": "boolean"
  },
  {
    "table_name": "notification_logs",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "notification_logs",
    "column_name": "driver_id",
    "data_type": "uuid"
  },
  {
    "table_name": "notification_logs",
    "column_name": "trip_assignment_id",
    "data_type": "uuid"
  },
  {
    "table_name": "notification_logs",
    "column_name": "notification_type",
    "data_type": "text"
  },
  {
    "table_name": "notification_logs",
    "column_name": "message",
    "data_type": "text"
  },
  {
    "table_name": "notification_logs",
    "column_name": "status",
    "data_type": "text"
  },
  {
    "table_name": "notification_logs",
    "column_name": "twilio_message_id",
    "data_type": "text"
  },
  {
    "table_name": "notification_logs",
    "column_name": "error_message",
    "data_type": "text"
  },
  {
    "table_name": "notification_logs",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "payments",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "payments",
    "column_name": "booking_id",
    "data_type": "uuid"
  },
  {
    "table_name": "payments",
    "column_name": "amount",
    "data_type": "numeric"
  },
  {
    "table_name": "payments",
    "column_name": "status",
    "data_type": "text"
  },
  {
    "table_name": "payments",
    "column_name": "provider",
    "data_type": "text"
  },
  {
    "table_name": "payments",
    "column_name": "provider_payment_id",
    "data_type": "text"
  },
  {
    "table_name": "payments",
    "column_name": "provider_session_id",
    "data_type": "text"
  },
  {
    "table_name": "payments",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "payments",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "profiles",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "profiles",
    "column_name": "full_name",
    "data_type": "text"
  },
  {
    "table_name": "profiles",
    "column_name": "mobile_number",
    "data_type": "text"
  },
  {
    "table_name": "profiles",
    "column_name": "date_of_birth",
    "data_type": "date"
  },
  {
    "table_name": "profiles",
    "column_name": "bio",
    "data_type": "text"
  },
  {
    "table_name": "profiles",
    "column_name": "avatar_url",
    "data_type": "text"
  },
  {
    "table_name": "profiles",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "profiles",
    "column_name": "role",
    "data_type": "character varying"
  },
  {
    "table_name": "routes",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "routes",
    "column_name": "from_location",
    "data_type": "text"
  },
  {
    "table_name": "routes",
    "column_name": "to_location",
    "data_type": "text"
  },
  {
    "table_name": "routes",
    "column_name": "base_price",
    "data_type": "numeric"
  },
  {
    "table_name": "routes",
    "column_name": "estimated_duration",
    "data_type": "interval"
  },
  {
    "table_name": "routes",
    "column_name": "status",
    "data_type": "boolean"
  },
  {
    "table_name": "routes",
    "column_name": "description",
    "data_type": "text"
  },
  {
    "table_name": "routes",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "routes",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "staff_roles",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "staff_roles",
    "column_name": "user_id",
    "data_type": "uuid"
  },
  {
    "table_name": "staff_roles",
    "column_name": "role",
    "data_type": "text"
  },
  {
    "table_name": "staff_roles",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "staff_roles",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "staff_roles_old",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "staff_roles_old",
    "column_name": "user_id",
    "data_type": "uuid"
  },
  {
    "table_name": "staff_roles_old",
    "column_name": "role",
    "data_type": "USER-DEFINED"
  },
  {
    "table_name": "staff_roles_old",
    "column_name": "permissions",
    "data_type": "jsonb"
  },
  {
    "table_name": "staff_roles_old",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "staff_roles_old",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "trip_assignments",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "trip_assignments",
    "column_name": "booking_id",
    "data_type": "uuid"
  },
  {
    "table_name": "trip_assignments",
    "column_name": "vehicle_id",
    "data_type": "uuid"
  },
  {
    "table_name": "trip_assignments",
    "column_name": "driver_id",
    "data_type": "uuid"
  },
  {
    "table_name": "trip_assignments",
    "column_name": "departure_time",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "trip_assignments",
    "column_name": "status",
    "data_type": "USER-DEFINED"
  },
  {
    "table_name": "trip_assignments",
    "column_name": "notes",
    "data_type": "text"
  },
  {
    "table_name": "trip_assignments",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "trip_assignments",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "users",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "users",
    "column_name": "first_name",
    "data_type": "text"
  },
  {
    "table_name": "users",
    "column_name": "last_name",
    "data_type": "text"
  },
  {
    "table_name": "users",
    "column_name": "phone",
    "data_type": "text"
  },
  {
    "table_name": "users",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "users",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "users",
    "column_name": "role",
    "data_type": "character varying"
  },
  {
    "table_name": "vehicles",
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "table_name": "vehicles",
    "column_name": "plate_number",
    "data_type": "text"
  },
  {
    "table_name": "vehicles",
    "column_name": "model",
    "data_type": "text"
  },
  {
    "table_name": "vehicles",
    "column_name": "capacity",
    "data_type": "integer"
  },
  {
    "table_name": "vehicles",
    "column_name": "status",
    "data_type": "USER-DEFINED"
  },
  {
    "table_name": "vehicles",
    "column_name": "last_maintenance_date",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "vehicles",
    "column_name": "notes",
    "data_type": "text"
  },
  {
    "table_name": "vehicles",
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "table_name": "vehicles",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  }
]