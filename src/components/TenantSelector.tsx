
import { Building, ChevronDown, Plus } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function TenantSelector() {
  const { currentTenant, userTenants, isLoading, switchTenant, refreshTenants } = useTenant();
  const { toast } = useToast();

  const createTenant = async () => {
    try {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .insert({
          name: `My Organization ${userTenants.length + 1}`,
          organization_size: 'small',
          industry: 'Other'
        })
        .select()
        .single();

      if (error) throw error;

      // Create membership for the user
      const { error: membershipError } = await supabase
        .from('tenant_memberships')
        .insert({
          tenant_id: tenant.id,
          is_owner: true,
          is_primary: true,
          role: 'admin'
        });

      if (membershipError) throw membershipError;

      await refreshTenants();
      toast({
        title: "Organization created",
        description: "Your new organization has been created successfully.",
      });
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast({
        title: "Error",
        description: "Failed to create organization. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <Skeleton className="h-9 w-[200px]" />;
  }

  // No tenants exist
  if (userTenants.length === 0) {
    return (
      <Button 
        variant="outline" 
        className="w-[200px] justify-start border-dashed border-orange-300"
        onClick={createTenant}
      >
        <Plus className="mr-2 h-4 w-4 text-orange-500" />
        <span className="text-orange-500">Create Organization</span>
      </Button>
    );
  }

  // Has tenants but none selected (should be rare)
  if (!currentTenant) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-[200px] justify-start border-orange-300">
            <Building className="mr-2 h-4 w-4 text-orange-500" />
            <span className="text-orange-500">Select Organization</span>
            <ChevronDown className="ml-auto h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>Your Organizations</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {userTenants.map((tenant) => (
            <DropdownMenuItem
              key={tenant.id}
              onClick={() => switchTenant(tenant.id)}
              className="cursor-pointer"
            >
              <Building className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>{tenant.name}</span>
                {tenant.description && (
                  <span className="text-xs text-muted-foreground">{tenant.description}</span>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Normal case - tenant selected
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-start">
          <Building className="mr-2 h-4 w-4" />
          {currentTenant.name}
          <ChevronDown className="ml-auto h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Your Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userTenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => switchTenant(tenant.id)}
            className={`cursor-pointer ${tenant.id === currentTenant.id ? 'bg-accent' : ''}`}
          >
            <Building className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>{tenant.name}</span>
              {tenant.description && (
                <span className="text-xs text-muted-foreground">{tenant.description}</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
