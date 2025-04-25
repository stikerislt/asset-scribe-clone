
import { useState, useEffect } from "react";
import { TenantSetupValues } from "../types/tenant-setup";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useActivity } from "@/hooks/useActivity";
import { toast } from "sonner";

export function useTenantSetup({ onComplete }: { onComplete: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [creationTimeout, setCreationTimeout] = useState<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const { logActivity } = useActivity();

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (creationTimeout) {
        clearTimeout(creationTimeout);
      }
    };
  }, [creationTimeout]);

  const handleSubmit = async (data: TenantSetupValues): Promise<void> => {
    // Comprehensive logging of input data
    console.log("[useTenantSetup] Starting tenant creation with data:", {
      ...data,
      userId: user?.id,
      userEmail: user?.email
    });
    
    if (!user) {
      const errorMsg = "No authenticated user found";
      console.error(`[useTenantSetup] ${errorMsg}`);
      toast.error(errorMsg);
      setHasError(true);
      setErrorMessage(errorMsg);
      return;
    }
    
    setIsSubmitting(true);
    setHasError(false);
    setErrorMessage(null);

    // Set a timeout to prevent hanging indefinitely
    const timeout = setTimeout(() => {
      console.error("[useTenantSetup] Operation timed out after 20 seconds");
      setIsSubmitting(false);
      setHasError(true);
      setErrorMessage("Operation timed out. Please try again.");
      toast.error("Organization creation timed out. Please try again.");
    }, 20000);
    
    setCreationTimeout(timeout);

    try {
      // Detailed session verification
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("[useTenantSetup] Session retrieval error:", sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }

      if (!sessionData.session) {
        console.error("[useTenantSetup] No active session found");
        throw new Error("No active session. Please log in again.");
      }
      
      console.log("[useTenantSetup] Session confirmed:", sessionData.session.user.id);

      // Comprehensive profile check
      const { data: profileData, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id, onboarding_completed, email')
        .eq('id', user.id)
        .single();
        
      if (profileCheckError) {
        console.error("[useTenantSetup] Profile check error:", profileCheckError);
        throw new Error(`Profile verification failed: ${profileCheckError.message}`);
      }

      if (!profileData) {
        console.error("[useTenantSetup] Profile not found for user:", user.id);
        throw new Error("User profile not found. Please contact support.");
      }

      console.log("[useTenantSetup] User profile verified:", profileData);

      // Tenant creation with comprehensive error handling
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
        .select()
        .single();
      
      if (tenantError) {
        console.error("[useTenantSetup] Tenant creation error:", tenantError);
        throw new Error(`Failed to create organization: ${tenantError.message}`);
      }

      if (!tenantData) {
        throw new Error("No data returned after organization creation");
      }
      
      console.log("[useTenantSetup] Tenant created successfully:", tenantData.id);

      // Create tenant membership with error handling
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
        throw new Error(`Failed to set up organization membership: ${membershipError.message}`);
      }
      
      console.log("[useTenantSetup] Membership created successfully");

      // Update profile onboarding status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (profileError) {
        console.error("[useTenantSetup] Profile update error:", profileError);
        // Don't throw here, as the essential parts of setup are complete
      } else {
        console.log("[useTenantSetup] Profile updated successfully");
      }

      // Clear the timeout since we succeeded
      if (creationTimeout) {
        clearTimeout(creationTimeout);
        setCreationTimeout(null);
      }

      // Log activity with comprehensive error handling
      try {
        await logActivity({
          title: "Organization Created",
          description: `Created organization ${data.name}`,
          category: 'system',
          tenant_id: tenantData.id
        });
      } catch (activityError) {
        console.error("[useTenantSetup] Failed to log activity:", activityError);
      }

      toast.success("Organization created successfully!");
      
      // Add a small delay before completing to ensure Supabase has time to update
      setTimeout(() => {
        console.log("[useTenantSetup] Setup complete, triggering onComplete callback");
        onComplete();
      }, 500);
    } catch (error: any) {
      // Clear the timeout if there's an error
      if (creationTimeout) {
        clearTimeout(creationTimeout);
        setCreationTimeout(null);
      }
      
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
