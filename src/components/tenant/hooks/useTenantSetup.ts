
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

  useEffect(() => {
    return () => {
      if (creationTimeout) {
        clearTimeout(creationTimeout);
      }
    };
  }, [creationTimeout]);

  const handleSubmit = async (data: TenantSetupValues): Promise<void> => {
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

    const timeout = setTimeout(() => {
      console.error("[useTenantSetup] Operation timed out after 20 seconds");
      setIsSubmitting(false);
      setHasError(true);
      setErrorMessage("Operation timed out. Please try again.");
      toast.error("Organization creation timed out. Please try again.");
    }, 20000);
    
    setCreationTimeout(timeout);

    try {
      // Force refresh the session to ensure we have the latest auth state
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error("[useTenantSetup] Session refresh error:", refreshError);
        throw new Error(`Auth refresh error: ${refreshError.message}`);
      }

      if (!refreshData.session) {
        console.error("[useTenantSetup] No session after refresh");
        throw new Error("Authentication session lost. Please log in again.");
      }
      
      console.log("[useTenantSetup] Session refreshed:", refreshData.session.user.id);

      // Verify that the user exists in profiles
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
        
        // Try to create the profile if missing
        const { data: newProfile, error: profileInsertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            onboarding_completed: false
          })
          .select()
          .single();
          
        if (profileInsertError) {
          console.error("[useTenantSetup] Failed to create missing profile:", profileInsertError);
          throw new Error(`User profile creation failed: ${profileInsertError.message}`);
        }
        
        console.log("[useTenantSetup] Created missing user profile:", newProfile);
      } else {
        console.log("[useTenantSetup] User profile verified:", profileData);
      }

      // Check if the user already has tenant memberships
      const { data: existingMemberships, error: membershipCheckError } = await supabase
        .from('tenant_memberships')
        .select('tenant_id')
        .eq('user_id', user.id);
        
      if (membershipCheckError) {
        console.warn("[useTenantSetup] Error checking existing memberships:", membershipCheckError);
      } else if (existingMemberships && existingMemberships.length > 0) {
        console.warn("[useTenantSetup] User already has existing memberships:", existingMemberships);
      }

      // Create the tenant with explicit auth context
      console.log("[useTenantSetup] Creating tenant with owner_id:", user.id);
      
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
        
        // Check for RLS issues by logging additional information
        console.log("[useTenantSetup] Debugging auth state:", { 
          uid: supabase.auth.getSession().then(s => console.log("Current session:", s)),
          hasValidSession: !!refreshData.session,
          sessionUserMatches: refreshData.session?.user.id === user.id
        });
        
        throw new Error(`Failed to create organization: ${tenantError.message}`);
      }

      if (!tenantData) {
        throw new Error("No data returned after organization creation");
      }
      
      console.log("[useTenantSetup] Tenant created successfully:", tenantData.id);

      // Create membership with explicit auth context
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

      // Mark onboarding as completed
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (profileError) {
        console.error("[useTenantSetup] Profile update error:", profileError);
      } else {
        console.log("[useTenantSetup] Profile updated successfully");
      }

      if (creationTimeout) {
        clearTimeout(creationTimeout);
        setCreationTimeout(null);
      }

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
      
      setTimeout(() => {
        console.log("[useTenantSetup] Setup complete, triggering onComplete callback");
        onComplete();
      }, 500);
    } catch (error: any) {
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
