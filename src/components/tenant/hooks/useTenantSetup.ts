
import { useState } from "react";
import { TenantSetupValues } from "../types/tenant-setup";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useActivity } from "@/hooks/useActivity";
import { toast } from "sonner";

export function useTenantSetup({ onComplete }: { onComplete: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user } = useAuth();
  const { logActivity } = useActivity();

  const handleSubmit = async (data: TenantSetupValues) => {
    if (!user) {
      toast.error("You must be logged in to create an organization");
      return;
    }
    
    setIsSubmitting(true);
    setHasError(false);
    setErrorMessage(null);

    try {
      console.log("[useTenantSetup] Starting tenant creation with data:", data);

      // Insert the tenant
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
        .select('*')
        .single();

      if (tenantError) {
        console.error("[useTenantSetup] Tenant creation error:", tenantError);
        throw new Error("Failed to create organization. Please try again.");
      }

      if (!tenantData) {
        throw new Error("No data returned after organization creation");
      }

      // Create tenant membership
      const { error: membershipError } = await supabase
        .from('tenant_memberships')
        .insert({
          tenant_id: tenantData.id,
          user_id: user.id,
          role: 'admin',
          is_primary: true,
          is_owner: true
        });

      if (membershipError) {
        console.error("[useTenantSetup] Membership creation error:", membershipError);
        throw new Error("Failed to set up organization membership");
      }

      // Update profile onboarding status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (profileError) {
        console.error("[useTenantSetup] Profile update error:", profileError);
      }

      // Log activity
      await logActivity({
        title: "Organization Created",
        description: `Created organization ${data.name}`,
        category: 'system'
      });

      toast.success("Organization created successfully!");
      onComplete();
    } catch (error: any) {
      console.error("[useTenantSetup] Error during organization setup:", error);
      setHasError(true);
      setErrorMessage(error.message);
      toast.error(error.message || "Failed to create organization");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
    hasError,
    errorMessage
  };
}
