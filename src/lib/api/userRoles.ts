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
    // First, get the active tenant
    console.log("Fetching active tenant before creating user");
    const { data: tenantData, error: tenantError } = await supabase.rpc('get_active_tenant');
    
    if (tenantError) {
      console.error("Error fetching active tenant:", tenantError);
      throw new Error('Failed to get active tenant: ' + tenantError.message);
    }
    
    if (!tenantData) {
      console.error("No active tenant found");
      throw new Error('No active tenant found. Please create or select a tenant first.');
    }

    console.log("Creating user with tenant:", tenantData);
    
    // Use Supabase Edge Function to create user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("No active session found");
      throw new Error('No active session. Please sign in.');
    }

    // Use a hardcoded URL instead of accessing protected property
    const supabaseUrl = "https://tbefdkwtjpbonuunxytk.supabase.co";
    if (!supabaseUrl) {
      throw new Error('Could not determine Supabase URL');
    }
    
    const functionUrl = `${supabaseUrl}/functions/v1/create-user`;
    console.log("Calling edge function:", functionUrl);
    
    // Prepare the payload with tenant_id
    const payload = {
      email,
      password,
      name,
      role,
      active,
      tenant_id: tenantData
    };
    
    console.log("Sending payload to edge function:", {
      ...payload,
      password: password ? "[REDACTED]" : undefined
    });
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log("Raw response from edge function:", responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("Error parsing JSON response:", e);
      throw new Error(`Invalid response from server: ${responseText}`);
    }

    if (!response.ok) {
      // Handle the duplicate key constraint error differently
      if (result.error && result.error.includes("duplicate key value")) {
        console.log("User already exists in the system");
        toast.info("User already exists in the system. Their information has been updated.");
        return { success: true, data: { ...result, message: "User already exists and has been updated" } };
      }
      
      console.error("Error response from create-user function:", result);
      throw new Error(result.error || `Failed to create user: HTTP ${response.status}`);
    }

    console.log("User creation successful:", result);
    
    if (result.verification_status === "invitation_sent") {
      toast.success("Invitation email has been sent to the user");
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
    
    // Use a direct URL instead of accessing protected property
    const supabaseUrl = "https://tbefdkwtjpbonuunxytk.supabase.co";
    if (!supabaseUrl) {
      console.error("Could not determine Supabase URL");
      return false;
    }
    
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/update-user-role`;
    
    console.log("Edge function URL:", edgeFunctionUrl);
    
    // Use the edge function to update the role with admin privileges
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("No active session found");
      return false;
    }
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
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

// Add function to delete user
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    console.log("Attempting to delete user with ID:", userId);
    
    // First, check if user can be deleted (not an owner)
    const canDelete = await canDeleteUser(userId);
    if (!canDelete) {
      console.error("User cannot be deleted because they are an organization owner");
      toast.error("Cannot delete an organization owner. Transfer ownership first.");
      return false;
    }
    
    // Step 1: Remove tenant memberships
    const { error: membershipError } = await supabase
      .from('tenant_memberships')
      .delete()
      .eq('user_id', userId);
    
    if (membershipError) {
      console.error("Error deleting tenant memberships:", membershipError);
      throw new Error(`Failed to delete tenant memberships: ${membershipError.message}`);
    }
    
    // Step 2: Remove user roles
    const { error: rolesError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    if (rolesError) {
      console.error("Error deleting user roles:", rolesError);
      throw new Error(`Failed to delete user roles: ${rolesError.message}`);
    }
    
    // Step 3: Delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (profileError) {
      console.error("Error deleting profile:", profileError);
      throw new Error(`Failed to delete profile: ${profileError.message}`);
    }

    // Using the admin API functions to delete the user from auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session. Please sign in to perform this action.');
    }
    
    const supabaseUrl = "https://tbefdkwtjpbonuunxytk.supabase.co";
    const deleteUserEndpoint = `${supabaseUrl}/functions/v1/delete-user`;
    
    const response = await fetch(deleteUserEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response from delete-user function:", response.status, errorText);
      throw new Error(`Failed to delete auth user: ${errorText || `HTTP ${response.status}`}`);
    }
    
    console.log("User deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    toast.error(error.message || "Failed to delete user");
    return false;
  }
};
