/*
  # Add get_enum_values Function
  
  This migration adds a function to get enum values for a given enum type.
  This is useful for the frontend to dynamically get the possible values for enum fields.
*/

-- Create function to get enum values
CREATE OR REPLACE FUNCTION get_enum_values(enum_name text)
RETURNS text[] AS $$
DECLARE
    enum_values text[];
BEGIN
    -- Get all enum values for the given enum type
    SELECT array_agg(e.enumlabel::text)
    INTO enum_values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = enum_name;
    
    RETURN enum_values;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 