
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  useEffect(() => {
    const setupUserAccount = async () => {
      if (isProcessing || !user) return;
      
      setIsProcessing(true);
      
      try {
        // Step 1: Check if user already has a tenant
        const { data: existingMemberships } = await supabase
          .from('tenant_memberships')
          .select('tenant_id')
          .eq('user_id', user.id);
        
        // If user already has a tenant, just mark onboarding as completed
        if (existingMemberships && existingMemberships.length > 0) {
          await completeOnboarding();
          navigate("/dashboard");
          return;
        }
        
        // Step 2: Create a new tenant for the user
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({
            name: `My Organization`,
            organization_size: 'small',
            industry: 'Other'
          })
          .select()
          .single();
        
        if (tenantError) throw tenantError;
        
        // Step 3: Create membership for the user
        const { error: membershipError } = await supabase
          .from('tenant_memberships')
          .insert({
            tenant_id: tenant.id,
            user_id: user.id,
            is_owner: true,
            is_primary: true,
            role: 'admin'
          });
        
        if (membershipError) throw membershipError;
        
        // Step 4: Mark onboarding as completed
        await completeOnboarding();
        
        toast.success("Your account has been set up successfully!");
        navigate("/dashboard");
      } catch (error) {
        console.error("Error setting up user account:", error);
        toast.error("Failed to complete account setup. Please try again.");
        setIsProcessing(false);
      }
    };
    
    setupUserAccount();
  }, [user, navigate]);

  // Mark onboarding as completed 
  const completeOnboarding = async () => {
    try {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
    } catch (error) {
      console.error("Error updating onboarding status:", error);
    }
  };

  // Show loading state while processing
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
      <p className="text-lg">Setting up your account...</p>
    </div>
  );
}
