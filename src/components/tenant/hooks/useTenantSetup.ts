
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

      // First, ensure we have a valid session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error("[useTenantSetup] Session error:", sessionError);
        throw new Error("Your session has expired. Please log in again.");
      }
      
      console.log("[useTenantSetup] Session confirmed:", sessionData.session.user.id);

      // Insert the tenant with a maximum timeout of 10 seconds
      const tenantPromise = supabase
        .from('tenants')
        .insert({
          name: data.name,
          description: data.description || null,
          website: data.website || null,
          industry: data.industry,
          organization_size: data.organizationSize,
          owner_id: user.id
        })
        .select()
        .single();
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Tenant creation timed out after 10 seconds")), 10000)
      );
      
      // Race between the fetch and the timeout
      const { data: tenantData, error: tenantError } = await Promise.race([
        tenantPromise,
        timeoutPromise.then(() => { 
          throw new Error("Tenant creation timed out");
        })
      ]) as any;

      if (tenantError) {
        console.error("[useTenantSetup] Tenant creation error:", tenantError);
        throw new Error("Failed to create organization: " + tenantError.message);
      }

      if (!tenantData) {
        throw new Error("No data returned after organization creation");
      }
      
      console.log("[useTenantSetup] Tenant created successfully:", tenantData.id);

      // Create tenant membership with timeout
      const membershipPromise = supabase
        .from('tenant_memberships')
        .insert({
          tenant_id: tenantData.id,
          user_id: user.id,
          role: 'admin',
          is_primary: true,
          is_owner: true
        });
      
      const { error: membershipError } = await Promise.race([
        membershipPromise,
        timeoutPromise.then(() => { 
          throw new Error("Membership creation timed out");
        })
      ]) as any;

      if (membershipError) {
        console.error("[useTenantSetup] Membership creation error:", membershipError);
        throw new Error("Failed to set up organization membership: " + membershipError.message);
      }
      
      console.log("[useTenantSetup] Membership created successfully");

      // Update profile onboarding status with timeout
      const profilePromise = supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
      
      const { error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise.then(() => { 
          throw new Error("Profile update timed out");
        })
      ]) as any;

      if (profileError) {
        console.error("[useTenantSetup] Profile update error:", profileError);
        // Don't throw here, as the essential parts of setup are complete
      } else {
        console.log("[useTenantSetup] Profile updated successfully");
      }

      // Log activity
      await logActivity({
        title: "Organization Created",
        description: `Created organization ${data.name}`,
        category: 'system',
        tenant_id: tenantData.id
      });

      toast.success("Organization created successfully!");
      
      // Add a small delay before completing to ensure Supabase has time to update
      setTimeout(() => {
        onComplete();
      }, 500);
    } catch (error: any) {
      console.error("[useTenantSetup] Error during organization setup:", error);
      setHasError(true);
      setErrorMessage(error.message || "Failed to create organization");
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
