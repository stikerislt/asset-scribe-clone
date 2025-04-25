
import { useState } from "react";
import { TenantSetupValues } from "../types/tenant-setup";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useActivity } from "@/hooks/useActivity";
import { toast } from "sonner";

export function useTenantSetup({ onComplete }: { onComplete: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { user } = useAuth();
  const { logActivity } = useActivity();

  const handleSubmit = async (data: TenantSetupValues) => {
    if (!user) {
      toast.error("You must be logged in to create an organization");
      return;
    }
    
    setIsSubmitting(true);
    setHasError(false);

    try {
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: data.name,
          description: data.description || null,
          website: data.website || null,
          industry: data.industry,
          organization_size: data.organizationSize,
          owner_id: user.id
        })
        .select();

      if (tenantError) {
        throw new Error(`Failed to create tenant: ${tenantError.message}`);
      }

      if (!tenantData || tenantData.length === 0) {
        throw new Error("No data returned after tenant creation");
      }

      const newTenantId = tenantData[0].id;

      const { error: membershipError } = await supabase
        .from('tenant_memberships')
        .insert({
          tenant_id: newTenantId,
          user_id: user.id,
          role: 'admin',
          is_primary: true,
          is_owner: true
        });

      if (membershipError) {
        throw new Error(`Failed to create membership: ${membershipError.message}`);
      }

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'admin'
        });

      if (roleError) {
        throw new Error(`Failed to create user role: ${roleError.message}`);
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (profileError) {
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }

      await logActivity({
        title: "Organization Created",
        description: `Created organization ${data.name}`,
        category: 'system'
      });

      toast.success("Organization created successfully!");
      onComplete();
    } catch (error: any) {
      console.error("[TenantSetupDialog] Error during organization setup:", error);
      setHasError(true);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
    hasError
  };
}
