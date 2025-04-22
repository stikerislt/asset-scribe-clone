
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  name: string;
  description: string | null;
  subscription_status: string;
}

interface TenantMembership {
  id: string;
  tenant_id: string;
  role: string;
  is_primary: boolean;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  userTenants: Tenant[];
  isLoading: boolean;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [userTenants, setUserTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchUserTenants = async () => {
    if (!user) {
      setUserTenants([]);
      setCurrentTenant(null);
      return;
    }

    try {
      const { data: memberships, error: membershipError } = await supabase
        .from('tenant_memberships')
        .select(`
          tenant_id,
          is_primary,
          tenants (
            id,
            name,
            description,
            subscription_status
          )
        `)
        .eq('user_id', user.id);

      if (membershipError) throw membershipError;

      const tenants = memberships.map(m => m.tenants as Tenant);
      setUserTenants(tenants);

      // Set current tenant to the primary one
      const primaryMembership = memberships.find(m => m.is_primary);
      if (primaryMembership) {
        setCurrentTenant(primaryMembership.tenants as Tenant);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Failed to load organization data');
    }
  };

  const switchTenant = async (tenantId: string) => {
    try {
      const { data, error } = await supabase.rpc('set_active_tenant', {
        tenant_id: tenantId
      });

      if (error) throw error;

      if (data) {
        const newTenant = userTenants.find(t => t.id === tenantId);
        if (newTenant) {
          setCurrentTenant(newTenant);
          toast.success(`Switched to ${newTenant.name}`);
        }
      }
    } catch (error) {
      console.error('Error switching tenant:', error);
      toast.error('Failed to switch organization');
    }
  };

  const refreshTenants = async () => {
    setIsLoading(true);
    await fetchUserTenants();
    setIsLoading(false);
  };

  useEffect(() => {
    refreshTenants();
  }, [user]);

  return (
    <TenantContext.Provider value={{
      currentTenant,
      userTenants,
      isLoading,
      switchTenant,
      refreshTenants,
    }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
