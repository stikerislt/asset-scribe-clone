
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

// Get all user roles
export const getAllUserRoles = async (): Promise<UserRoleData[]> => {
  // Must use rpc for user_roles table as it's not directly accessible via select
  const { data: roles, error } = await supabase.rpc('get_user_roles');
  
  if (error) {
    console.error("Error fetching user roles:", error);
    return [];
  }
  
  return roles || [];
};

// Update a user's role
export const updateUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
  // Use rpc to update role
  const { error } = await supabase.rpc('update_user_role', {
    p_user_id: userId,
    p_role: role
  });
  
  if (error) {
    console.error("Error updating user role:", error);
    return false;
  }
  
  return true;
};
