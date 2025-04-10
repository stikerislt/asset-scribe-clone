
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
