
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdminAccess() {
  const { user } = useAuth();
  
  const { data, isLoading } = useQuery({
    queryKey: ['user-admin-access', user?.id],
    queryFn: async () => {
      if (!user?.id) return { isAdmin: false, isOwner: false };
      
      // Check if user is owner of any tenant
      const { data: ownerData } = await supabase
        .from('tenant_memberships')
        .select('is_owner')
        .eq('user_id', user.id)
        .eq('is_owner', true)
        .single();
      
      if (ownerData?.is_owner) return { isAdmin: true, isOwner: true };
      
      // Check if user has admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      return { 
        isAdmin: roleData?.role === 'admin' || roleData?.role === 'manager', 
        isOwner: false 
      };
    },
    enabled: !!user
  });

  return {
    isAdmin: data?.isAdmin || false,
    isOwner: data?.isOwner || false,
    hasAdminAccess: data?.isAdmin || data?.isOwner || false,
    isLoading
  };
}
