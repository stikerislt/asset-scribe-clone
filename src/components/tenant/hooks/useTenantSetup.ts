
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
  const { user } = useAuth();
  const { logActivity } = useActivity();

  const handleSubmit = async (data: TenantSetupValues): Promise<void> => {
    console.log("[useTenantSetup] Starting tenant creation with data:", {
      ...data,
      userId: user?.id
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

    try {
      // Force refresh the session first
      const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
      console.log("[useTenantSetup] Session refresh result:", { 
        success: !!sessionData.session,
        error: sessionError,
        userId: sessionData.session?.user?.id 
      });
      
      if (sessionError || !sessionData.session) {
        throw new Error("Failed to refresh auth session");
      }

      // Verify user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, onboarding_completed')
        .eq('id', user.id)
        .single();
        
      console.log("[useTenantSetup] Profile check result:", { 
        profile, 
        error: profileError,
        hasProfile: !!profile
      });

      if (profileError) {
        console.log("[useTenantSetup] Profile not found, creating new profile");
        // If profile doesn't exist, try to create it
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            onboarding_completed: false
          });
          
        if (createProfileError) {
          console.error("[useTenantSetup] Failed to create profile:", createProfileError);
          throw new Error("Failed to setup user profile");
        }
        
        console.log("[useTenantSetup] Profile created successfully");
      }
      
      console.log("[useTenantSetup] Creating tenant with data:", {
        ...data,
        owner_id: user.id
      });

      // Create the tenant with explicit owner_id
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: data.name,
          description: data.description || null,
          website: data.website || null,
          industry: data.industry,
          organization_size: data.organizationSize,
          owner_id: user.id // Explicitly set owner_id
        })
        .select()
        .single();
      
      if (tenantError) {
        console.error("[useTenantSetup] Tenant creation error:", {
          error: tenantError,
          code: tenantError.code,
          details: tenantError.details,
          message: tenantError.message
        });
        throw new Error(`Failed to create organization: ${tenantError.message}`);
      }

      console.log("[useTenantSetup] Tenant created successfully:", tenantData);

      // Create membership for the owner
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
        console.error("[useTenantSetup] Membership creation error:", {
          error: membershipError,
          code: membershipError.code,
          details: membershipError.details
        });
        throw new Error(`Failed to set up organization membership: ${membershipError.message}`);
      }

      console.log("[useTenantSetup] Membership created successfully");

      // Mark onboarding as completed
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (profileUpdateError) {
        console.error("[useTenantSetup] Profile update error:", {
          error: profileUpdateError,
          code: profileUpdateError.code,
          details: profileUpdateError.details
        });
      }

      await logActivity({
        title: "Organization Created",
        description: `Created organization ${data.name}`,
        category: 'system',
        tenant_id: tenantData.id
      });

      console.log("[useTenantSetup] Setup completed successfully");
      toast.success("Organization created successfully!");
      onComplete();
      
    } catch (error: any) {
      console.error("[useTenantSetup] Error during organization setup:", {
        error,
        message: error.message,
        stack: error.stack
      });
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
