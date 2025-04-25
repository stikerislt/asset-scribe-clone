
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
      
      // First, validate the session is active
      const { data: authState, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error("[useTenantSetup] Authentication check error:", authError);
        throw new Error(`Authentication error: ${authError.message}. Please try logging out and back in.`);
      }
      
      if (!authState.session) {
        console.error("[useTenantSetup] No active session found");
        throw new Error("Your session has expired. Please log out and log back in to continue.");
      }

      // Try to insert the tenant without RLS restrictions
      // We'll use a different approach by using RPC to bypass RLS
      // This requires setting up a database function in Supabase
      
      // For now, attempt a direct insert as a fallback
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
        
        if (tenantError.code === '42501') {
          // This is a Row Level Security policy violation
          throw new Error(`Failed to create organization due to insufficient permissions. Please try refreshing the page, or log out and log in again.`);
        } else {
          throw new Error(`Failed to create organization: ${tenantError.message}`);
        }
      }

      if (!tenantData) {
        throw new Error("No data returned after organization creation");
      }

      console.log("[useTenantSetup] Organization created successfully:", tenantData);
      const newTenantId = tenantData.id;

      // Create tenant membership
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
        console.error("[useTenantSetup] Membership creation error:", membershipError);
        throw new Error(`Failed to create membership: ${membershipError.message}`);
      }

      // Update profile onboarding status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (profileError) {
        console.error("[useTenantSetup] Profile update error:", profileError);
        throw new Error(`Failed to update profile: ${profileError.message}`);
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
