import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with custom configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'islaGO-admin'
    }
  }
})

// Add response interceptor for debugging
const originalFrom = supabase.from.bind(supabase)
supabase.from = (table) => {
  const result = originalFrom(table)
  const originalSelect = result.select.bind(result)
  
  result.select = (...args) => {
    const query = originalSelect(...args)
    const originalThen = query.then.bind(query)
    
    query.then = (...thenArgs) => {
      return originalThen((...resolveArgs) => {
        const [data, error] = resolveArgs
        if (error) {
          console.error(`Supabase query error for ${table}:`, {
            error,
            details: error.details,
            message: error.message,
            hint: error.hint
          })
        }
        return thenArgs[0](...resolveArgs)
      })
    }
    
    return query
  }
  
  return result
}

// Test function to verify connection
export const testConnection = async () => {
  try {
    // First test the connection by checking if we can access the bookings table
    const { data, error } = await supabase
      .from('bookings')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Supabase connection test failed:', error)
      return false
    }

    console.log('Supabase connection successful')
    return true
  } catch (error) {
    console.error('Supabase connection error:', error)
    return false
  }
}

// Booking functions
export const createBooking = async (bookingData) => {
  const { data, error } = await supabase
    .from('bookings')
    .insert([bookingData])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getBookings = async (userId) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      customers (
        first_name,
        last_name,
        mobile_number
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const updateBookingPaymentStatus = async (sessionId, status) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        payment_status: status,
        payment_session_id: sessionId,
        updated_at: new Date().toISOString()
      })
      .eq('payment_session_id', sessionId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating booking payment status:', error);
    throw error;
  }
};

// Customer functions
export const createCustomer = async (customerData) => {
  const { data, error } = await supabase
    .from('customers')
    .insert([customerData])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getCustomer = async (userId) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

// Staff role management functions
export const getStaffRole = async (userId) => {
  try {
    console.log('Getting staff role for user:', userId);
    
    // First try direct table access for debugging
    const { data: directData, error: directError } = await supabase
      .from('staff_roles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    console.log('Direct table access result:', { directData, directError });

    // Then try RPC
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_user_role', {
        user_uuid: userId
      });

    console.log('RPC result:', { rpcData, rpcError });

    if (rpcError) {
      console.error('RPC Error getting staff role:', rpcError);
      
      if (directData?.role) {
        console.log('Using direct table access result:', directData.role);
        return { success: true, role: directData.role };
      }
      
      console.log('No role found in direct access');
      return { success: false, error: rpcError };
    }
    
    // Handle different response formats
    let roleValue;
    if (typeof rpcData === 'object' && rpcData !== null) {
      roleValue = rpcData.role;
    } else if (typeof rpcData === 'string') {
      roleValue = rpcData;
    } else {
      roleValue = null;
    }
    
    console.log('Final processed role value:', roleValue);
    return { success: true, role: roleValue };
  } catch (error) {
    console.error('Error getting staff role:', error);
    return { success: false, error };
  }
};

export const addStaffRole = async (userId, role) => {
  try {
    console.log('Adding staff role:', { userId, role });
    const { data, error } = await supabase
      .rpc('add_staff_role_safe', {
        role_name: role,
        user_uuid: userId
      });

    console.log('RPC result:', { data, error });

    if (error) {
      console.error('RPC Error adding staff role:', error);
      // Fallback to direct table access if RPC fails
      console.log('Attempting fallback to direct table access');
      
      // First, delete any existing role
      const { error: deleteError } = await supabase
        .from('staff_roles')
        .delete()
        .eq('user_id', userId);
        
      if (deleteError) {
        console.error('Error deleting existing role:', deleteError);
        throw deleteError;
      }

      // Then insert the new role
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('staff_roles')
        .upsert([
          {
            user_id: userId,
            role: role
          }
        ])
        .select()
        .single();
      
      console.log('Fallback result:', { fallbackData, fallbackError });
      
      if (fallbackError) throw fallbackError;
      return { success: true, data: fallbackData };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error adding staff role:', error);
    return { success: false, error };
  }
};

export default supabase