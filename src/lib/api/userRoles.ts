import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

// Update user role by email - using edge function to bypass RLS
export const updateUserRoleByEmail = async (email: string, role: UserRole): Promise<boolean> => {
  try {
    console.log(`Calling edge function to update role for ${email} to ${role}`);
    
    // Fix: Explicitly construct the full URL with /functions/v1/ path
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/update-user-role`;
    
    console.log("Edge function URL:", edgeFunctionUrl);
    
    // Use the edge function to update the role with admin privileges
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email,
        role
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Edge function response error:", response.status, errorText);
      throw new Error(`Failed to update role: HTTP ${response.status}`);
    }

    const result = await response.json();
    
    console.log("Edge function response:", result);
    return true;
  } catch (error) {
    console.error("Error updating user role by email:", error);
    return false;
  }
};

// Add function to check if user can be deleted
export const canDeleteUser = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('can_delete_user', {
    user_id: userId
  });
  
  if (error) {
    console.error('Error checking if user can be deleted:', error);
    return false;
  }
  
  return data;
};

// Add function to transfer tenant ownership
export const transferTenantOwnership = async (tenantId: string, newOwnerId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('transfer_tenant_ownership', {
      tenant_id: tenantId,
      new_owner_id: newOwnerId
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error transferring tenant ownership:', error);
    toast.error(error.message || 'Failed to transfer ownership');
    return false;
  }
};
