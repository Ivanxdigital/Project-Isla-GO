# IslaGo Database Schema & RLS Policies

This file contains the complete database schema (tables and columns), Row-Level Security (RLS) policies, and a reference to installed PostgreSQL extensions for the IslaGo application.

---

## 1. Table Structures

```json
[
  {
    "table_name": "admin_access",
    "columns": [
      "user_id uuid",
      "is_super_admin boolean",
      "created_at timestamp with time zone"
    ]
  },
  {
    "table_name": "bookings",
    "columns": [
      "return_time time without time zone",
      "created_at timestamp with time zone",
      "return_date date",
      "updated_at timestamp with time zone",
      "group_size integer",
      "payment_session_id text",
      "status text",
      "payment_status text",
      "payment_method text",
      "from_location text",
      "to_location text",
      "service_type text",
      "id uuid",
      "customer_id uuid",
      "departure_date date",
      "departure_time time without time zone",
      "total_amount numeric",
      "user_id uuid"
    ]
  },
  {
    "table_name": "customers",
    "columns": [
      "first_name text",
      "last_name text",
      "mobile_number text",
      "id uuid",
      "updated_at timestamp with time zone",
      "user_id uuid",
      "messenger_contact text",
      "messenger_type text",
      "created_at timestamp with time zone"
    ]
  },
  {
    "table_name": "driver_application_drafts",
    "columns": [
      "last_updated timestamp with time zone",
      "current_step integer",
      "user_id uuid",
      "id uuid",
      "form_data jsonb"
    ]
  },
  {
    "table_name": "driver_applications",
    "columns": [
      "mobile_number text",
      "email text",
      "full_name text",
      "documents jsonb",
      "driver_id uuid",
      "id uuid",
      "notes text",
      "license_expiration date",
      "medical_certificate_url text",
      "nbi_clearance_url text",
      "vehicle_rear_url text",
      "vehicle_year integer",
      "vehicle_side_url text",
      "vehicle_front_url text",
      "insurance_url text",
      "or_cr_url text",
      "driver_license_url text",
      "policy_expiration date",
      "account_holder text",
      "account_number text",
      "bank_name text",
      "cpc_number text",
      "tnvs_number text",
      "policy_number text",
      "insurance_provider text",
      "vehicle_color text",
      "or_cr_number text",
      "plate_number text",
      "vehicle_model text",
      "vehicle_make text",
      "license_type text",
      "status USER-DEFINED",
      "license_number text",
      "reviewed_by uuid",
      "reviewed_at timestamp with time zone",
      "created_at timestamp with time zone",
      "updated_at timestamp with time zone",
      "address text",
      "user_id uuid"
    ]
  },
  {
    "table_name": "driver_availability",
    "columns": [
      "created_at timestamp with time zone",
      "is_available boolean",
      "time_slot time without time zone",
      "location text",
      "day_of_week integer",
      "driver_id uuid",
      "id uuid",
      "updated_at timestamp with time zone"
    ]
  },
  {
    "table_name": "drivers",
    "columns": [
      "id uuid",
      "license_expiry date",
      "created_at timestamp with time zone",
      "updated_at timestamp with time zone",
      "documents_verified boolean",
      "status USER-DEFINED",
      "name text",
      "license_number text",
      "contact_number text",
      "emergency_contact text",
      "notes text"
    ]
  },
  {
    "table_name": "payments",
    "columns": [
      "created_at timestamp with time zone",
      "id uuid",
      "booking_id uuid",
      "status text",
      "provider text",
      "provider_payment_id text",
      "provider_session_id text",
      "amount numeric",
      "updated_at timestamp with time zone"
    ]
  },
  {
    "table_name": "profiles",
    "columns": [
      "created_at timestamp with time zone",
      "date_of_birth date",
      "id uuid",
      "full_name text",
      "mobile_number text",
      "avatar_url text",
      "role character varying",
      "bio text"
    ]
  },
  {
    "table_name": "routes",
    "columns": [
      "from_location text",
      "created_at timestamp with time zone",
      "status boolean",
      "base_price numeric",
      "estimated_duration interval",
      "id uuid",
      "updated_at timestamp with time zone",
      "description text",
      "to_location text"
    ]
  },
  {
    "table_name": "staff_roles",
    "columns": [
      "created_at timestamp with time zone",
      "role text",
      "updated_at timestamp with time zone",
      "user_id uuid",
      "id uuid"
    ]
  },
  {
    "table_name": "staff_roles_old",
    "columns": [
      "user_id uuid",
      "role USER-DEFINED",
      "permissions jsonb",
      "created_at timestamp with time zone",
      "updated_at timestamp with time zone",
      "id uuid"
    ]
  },
  {
    "table_name": "trip_assignments",
    "columns": [
      "created_at timestamp with time zone",
      "vehicle_id uuid",
      "updated_at timestamp with time zone",
      "booking_id uuid",
      "id uuid",
      "notes text",
      "departure_time timestamp with time zone",
      "status USER-DEFINED",
      "driver_id uuid"
    ]
  },
  {
    "table_name": "users",
    "columns": [
      "id uuid",
      "created_at timestamp with time zone",
      "updated_at timestamp with time zone",
      "phone text",
      "role character varying",
      "first_name text",
      "last_name text"
    ]
  },
  {
    "table_name": "vehicles",
    "columns": [
      "updated_at timestamp with time zone",
      "created_at timestamp with time zone",
      "capacity integer",
      "plate_number text",
      "status USER-DEFINED",
      "notes text",
      "model text",
      "last_maintenance_date timestamp with time zone",
      "id uuid"
    ]
  }
]

---
## 2. RLS Policies
[
  {
    "tablename": "vehicles",
    "policyname": "Drivers can view assigned vehicles",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "((id IN ( SELECT trip_assignments.vehicle_id\n   FROM trip_assignments\n  WHERE (trip_assignments.driver_id = auth.uid()))) AND (EXISTS ( SELECT 1\n   FROM staff_roles\n  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'driver'::text)))))",
    "with_check": null
  },
  {
    "tablename": "profiles",
    "policyname": "Users can insert own profile",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = id)"
  },
  {
    "tablename": "profiles",
    "policyname": "Users can update own profile",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = id)",
    "with_check": null
  },
  {
    "tablename": "vehicles",
    "policyname": "Staff can view vehicles",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() IN ( SELECT staff_roles_old.user_id\n   FROM staff_roles_old))",
    "with_check": null
  },
  {
    "tablename": "vehicles",
    "policyname": "Only admins can modify vehicles",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(auth.uid() IN ( SELECT staff_roles_old.user_id\n   FROM staff_roles_old\n  WHERE (staff_roles_old.role = 'admin'::user_role)))",
    "with_check": "(auth.uid() IN ( SELECT staff_roles_old.user_id\n   FROM staff_roles_old\n  WHERE (staff_roles_old.role = 'admin'::user_role)))"
  },
  {
    "tablename": "staff_roles",
    "policyname": "Enable all operations for admins and self-view",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "((auth.uid() = user_id) OR (auth.uid() = '681a7bc2-4274-4cb4-a5e8-cd2ebf0e9c27'::uuid))",
    "with_check": null
  },
  {
    "tablename": "routes",
    "policyname": "Staff can view routes",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() IN ( SELECT staff_roles_old.user_id\n   FROM staff_roles_old))",
    "with_check": null
  },
  {
    "tablename": "routes",
    "policyname": "Only admins can modify routes",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(auth.uid() IN ( SELECT staff_roles_old.user_id\n   FROM staff_roles_old\n  WHERE (staff_roles_old.role = 'admin'::user_role)))",
    "with_check": "(auth.uid() IN ( SELECT staff_roles_old.user_id\n   FROM staff_roles_old\n  WHERE (staff_roles_old.role = 'admin'::user_role)))"
  },
  {
    "tablename": "trip_assignments",
    "policyname": "Staff can view trip assignments",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() IN ( SELECT staff_roles_old.user_id\n   FROM staff_roles_old))",
    "with_check": null
  },
  {
    "tablename": "trip_assignments",
    "policyname": "Admins can modify trip assignments",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(auth.uid() IN ( SELECT staff_roles_old.user_id\n   FROM staff_roles_old\n  WHERE (staff_roles_old.role = 'admin'::user_role)))",
    "with_check": null
  },
  {
    "tablename": "trip_assignments",
    "policyname": "Support staff can update pending trips",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "((auth.uid() IN ( SELECT staff_roles_old.user_id\n   FROM staff_roles_old\n  WHERE (staff_roles_old.role = 'support'::user_role))) AND (status = ANY (ARRAY['pending'::trip_status, 'confirmed'::trip_status])))",
    "with_check": "((auth.uid() IN ( SELECT staff_roles_old.user_id\n   FROM staff_roles_old\n  WHERE (staff_roles_old.role = 'support'::user_role))) AND (status = ANY (ARRAY['pending'::trip_status, 'confirmed'::trip_status])))"
  },
  {
    "tablename": "staff_roles_old",
    "policyname": "Enable read access for authenticated users",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "tablename": "driver_applications",
    "policyname": "driver_applications_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "((EXISTS ( SELECT 1\n   FROM admin_access\n  WHERE ((admin_access.user_id = auth.uid()) AND (admin_access.is_super_admin = true)))) OR (auth.uid() = driver_id))",
    "with_check": null
  },
  {
    "tablename": "admin_access",
    "policyname": "admin_access_policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "tablename": "staff_roles",
    "policyname": "allow_read_own_role",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "tablename": "staff_roles",
    "policyname": "Staff roles access policy",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "((EXISTS ( SELECT 1\n   FROM admin_access\n  WHERE ((admin_access.user_id = auth.uid()) AND (admin_access.is_super_admin = true)))) OR (auth.uid() = user_id))",
    "with_check": null
  },
  {
    "tablename": "drivers",
    "policyname": "Drivers can view their own profile",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "((id = auth.uid()) AND (EXISTS ( SELECT 1\n   FROM staff_roles\n  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'driver'::text)))))",
    "with_check": null
  },
  {
    "tablename": "drivers",
    "policyname": "Drivers can update their own status",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "((id = auth.uid()) AND (EXISTS ( SELECT 1\n   FROM staff_roles\n  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'driver'::text)))))",
    "with_check": "((id = auth.uid()) AND (EXISTS ( SELECT 1\n   FROM staff_roles\n  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'driver'::text)))))"
  },
  {
    "tablename": "profiles",
    "policyname": "Anyone can view profiles",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "tablename": "staff_roles",
    "policyname": "staff_roles_access_policy",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "tablename": "staff_roles",
    "policyname": "staff_roles_admin_policy",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM staff_roles staff_roles_1\n  WHERE ((staff_roles_1.user_id = auth.uid()) AND (staff_roles_1.role = 'admin'::text))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM staff_roles staff_roles_1\n  WHERE ((staff_roles_1.user_id = auth.uid()) AND (staff_roles_1.role = 'admin'::text))))"
  },
  {
    "tablename": "trip_assignments",
    "policyname": "Drivers can view their assigned trips",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "((driver_id = auth.uid()) AND (EXISTS ( SELECT 1\n   FROM staff_roles\n  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'driver'::text)))))",
    "with_check": null
  },
  {
    "tablename": "drivers",
    "policyname": "Only admins can modify drivers",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(EXISTS ( SELECT 1\n   FROM staff_roles\n  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'admin'::text))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM staff_roles\n  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'admin'::text))))"
  },
  {
    "tablename": "drivers",
    "policyname": "Staff can view drivers",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(EXISTS ( SELECT 1\n   FROM staff_roles\n  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = ANY (ARRAY['admin'::text, 'staff'::text])))))",
    "with_check": null
  },
  {
    "tablename": "users",
    "policyname": "Users can view own data",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = id)",
    "with_check": null
  },
  {
    "tablename": "users",
    "policyname": "Users can insert own data",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = id)"
  },
  {
    "tablename": "users",
    "policyname": "Users can update own data",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = id)",
    "with_check": null
  },
  {
    "tablename": "staff_roles",
    "policyname": "Enable read access for authenticated users",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "tablename": "staff_roles",
    "policyname": "Users can read own roles",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "tablename": "driver_availability",
    "policyname": "Drivers can manage their own availability",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "(auth.uid() = driver_id)",
    "with_check": null
  },
  {
    "tablename": "customers",
    "policyname": "Enable all for authenticated users",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "tablename": "bookings",
    "policyname": "Enable all for authenticated users",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "true",
    "with_check": "true"
  },
  {
    "tablename": "bookings",
    "policyname": "Drivers can view assigned bookings",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "((id IN ( SELECT trip_assignments.booking_id\n   FROM trip_assignments\n  WHERE (trip_assignments.driver_id = auth.uid()))) AND (EXISTS ( SELECT 1\n   FROM staff_roles\n  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'driver'::text)))))",
    "with_check": null
  },
  {
    "tablename": "bookings",
    "policyname": "Drivers can update assigned booking status",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "((id IN ( SELECT trip_assignments.booking_id\n   FROM trip_assignments\n  WHERE (trip_assignments.driver_id = auth.uid()))) AND (EXISTS ( SELECT 1\n   FROM staff_roles\n  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'driver'::text)))))",
    "with_check": "((id IN ( SELECT trip_assignments.booking_id\n   FROM trip_assignments\n  WHERE (trip_assignments.driver_id = auth.uid()))) AND (EXISTS ( SELECT 1\n   FROM staff_roles\n  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = 'driver'::text)))))"
  },
  {
    "tablename": "trip_assignments",
    "policyname": "Drivers can view their own trips",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "((driver_id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM staff_roles\n  WHERE ((staff_roles.user_id = auth.uid()) AND (staff_roles.role = ANY (ARRAY['admin'::text, 'staff'::text]))))))",
    "with_check": null
  }
]