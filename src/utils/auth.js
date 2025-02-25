import { supabase } from './supabase';

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
  return { success: true };
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    throw error;
  }
  
  return user;
}

export async function checkAuthorization() {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    if (!user) return { authorized: false, role: null };

    // Check staff_roles table for user's role
    const { data: roleData, error: roleError } = await supabase
      .from('staff_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError && roleError.code !== 'PGRST116') {
      throw roleError;
    }

    return {
      authorized: !!roleData?.role,
      role: roleData?.role || null,
      user
    };
  } catch (error) {
    console.error('Authorization check failed:', error);
    return { authorized: false, role: null, error };
  }
}