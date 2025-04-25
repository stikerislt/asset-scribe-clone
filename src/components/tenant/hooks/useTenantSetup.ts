
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
    
    console.log("[useTenantSetup] Starting tenant creation with user:", user.id);
    setIsSubmitting(true);
    setHasError(false);
    setErrorMessage(null);

    try {
      console.log("[useTenantSetup] Submitting tenant data:", data);

      // Check if user session is still valid
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("[useTenantSetup] Session error:", sessionError);
        throw new Error("Session error: " + sessionError.message);
      }
      
      if (!sessionData.session) {
        console.error("[useTenantSetup] No active session found");
        throw new Error("No active session found. Please log in again.");
      }
      
      console.log("[useTenantSetup] Session confirmed:", sessionData.session.user.id);

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
      
      console.log("[useTenantSetup] Tenant created successfully:", tenantData.id);

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
      
      console.log("[useTenantSetup] Membership created successfully");

      // Update profile onboarding status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (profileError) {
        console.error("[useTenantSetup] Profile update error:", profileError);
      }

      console.log("[useTenantSetup] Profile updated successfully");

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
