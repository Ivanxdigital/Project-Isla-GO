# Supabase Migrations

This directory contains SQL migration files for the Supabase database.

## How to Apply Migrations

### Using Supabase CLI

1. Install the Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

3. Apply migrations:
   ```bash
   supabase db push
   ```

### Manual Application

If you prefer to apply migrations manually:

1. Log in to the Supabase dashboard
2. Go to the SQL Editor
3. Copy the contents of the migration file
4. Paste into the SQL Editor and run the query

## Migration Files

- `20240501000000_create_email_failures_table.sql`: Creates a table to track email sending failures for better debugging and monitoring.

## Troubleshooting

If you encounter any issues with migrations, please check:

1. That your Supabase instance has the `uuid-ossp` extension enabled
2. That you have the necessary permissions to create tables
3. That referenced tables (like `bookings`) exist before running migrations that reference them 