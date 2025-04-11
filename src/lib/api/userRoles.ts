
import { supabase } from "@/integrations/supabase/client";

// Define user role type
export type UserRole = 'admin' | 'manager' | 'user';

export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Check if a user has a specific role
export const hasRole = async (userId: string, role: UserRole): Promise<boolean> => {
  if (!userId) return false;
  
  const { data, error } = await supabase.rpc('has_role', {
    user_id: userId,
    role: role
  });
  
  if (error) {
    console.error("Error checking role:", error);
    return false;
  }
  
  return !!data;
};

// Check if a user is an admin
export const isAdmin = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  const { data, error } = await supabase.rpc('is_admin', {
    user_id: userId
  });
  
  if (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
  
  return !!data;
};

// Get all user roles - using a direct fetch instead of rpc
export const getAllUserRoles = async (): Promise<UserRoleData[]> => {
  // Use from() instead of rpc() since we're having type issues
  const { data, error } = await supabase
    .from('user_roles')
    .select('*');
  
  if (error) {
    console.error("Error fetching user roles:", error);
    return [];
  }
  
  return data || [];
};

// Update a user's role - using direct upsert instead of rpc
export const updateUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
  // Use upsert instead of rpc
  const { error } = await supabase
    .from('user_roles')
    .upsert({ 
      user_id: userId, 
      role: role,
      updated_at: new Date().toISOString()
    }, { 
      onConflict: 'user_id' 
    });
  
  if (error) {
    console.error("Error updating user role:", error);
    return false;
  }
  
  return true;
};

// Create a new user with specified role via Edge Function
export const createUser = async (
  email: string, 
  password: string, 
  name: string, 
  role: string, 
  active: boolean
): Promise<{success: boolean, data?: any, error?: string}> => {
  try {
    // Use Supabase Edge Function to create user
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email,
        password,
        name,
        role,
        active
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create user');
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message };
  }
};

// Update user role by email
export const updateUserRoleByEmail = async (email: string, role: UserRole): Promise<boolean> => {
  try {
    // First fetch the user profile by email
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .limit(1);
    
    if (profileError) {
      console.error("Error finding user profile:", profileError);
      return false;
    }
    
    if (!profiles || profiles.length === 0) {
      console.error("User profile not found for email:", email);
      return false;
    }
    
    // Update the user's role
    const userId = profiles[0].id;
    return await updateUserRole(userId, role);
    
  } catch (error) {
    console.error("Error updating user role by email:", error);
    return false;
  }
};
