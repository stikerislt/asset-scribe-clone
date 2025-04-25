
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Initializing setup...");

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  useEffect(() => {
    const setupUserAccount = async () => {
      if (isProcessing || !user) return;
      
      setIsProcessing(true);
      
      try {
        // Update progress
        setStatusMessage("Checking existing account data...");
        setProgressValue(10);
        
        // Step 1: Check if user already has a tenant
        const { data: existingMemberships } = await supabase
          .from('tenant_memberships')
          .select('tenant_id')
          .eq('user_id', user.id);
        
        setProgressValue(30);
        
        // If user already has a tenant, just mark onboarding as completed
        if (existingMemberships && existingMemberships.length > 0) {
          setStatusMessage("Account already set up, finalizing...");
          await completeOnboarding();
          navigate("/dashboard");
          return;
        }
        
        // Step 2: Create a new tenant for the user
        setStatusMessage("Creating organization...");
        setProgressValue(50);
        
        // Need to use RPC function or service role to bypass RLS
        // For now, let's try using the service role client (if available) or an RPC function
        // This is a safer approach than disabling RLS
        const { data: tenant, error: tenantError } = await supabase
          .rpc('create_tenant_for_user', { 
            tenant_name: 'My Organization',
            org_size: 'small',
            org_industry: 'Other'
          });
          
        if (tenantError) {
          console.error("Error creating tenant:", tenantError);
          // Fallback approach - try direct insert but this might still fail depending on RLS
          const directInsertResult = await supabase
            .from('tenants')
            .insert({
              name: 'My Organization',
              organization_size: 'small',
              industry: 'Other',
              // Explicitly set the owner_id to the current user
              owner_id: user.id
            })
            .select()
            .single();
            
          if (directInsertResult.error) {
            throw directInsertResult.error;
          }
          
          // Use the tenant from direct insert
          setProgressValue(70);
          setStatusMessage("Setting up membership...");
          
          // Step 3: Create membership for the user
          const { error: membershipError } = await supabase
            .from('tenant_memberships')
            .insert({
              tenant_id: directInsertResult.data.id,
              user_id: user.id,
              is_owner: true,
              is_primary: true,
              role: 'admin'
            });
          
          if (membershipError) throw membershipError;
        } else {
          setProgressValue(70);
          setStatusMessage("Organization created successfully!");
          // If the RPC function was successful, we don't need to create a membership
          // as the RPC function should have taken care of that
        }
        
        // Step 4: Mark onboarding as completed
        setProgressValue(90);
        setStatusMessage("Finalizing account setup...");
        await completeOnboarding();
        
        setProgressValue(100);
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card p-6 rounded-lg border shadow-sm">
        <h2 className="text-2xl font-semibold mb-6 text-center">Setting up your account</h2>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Progress value={progressValue} className="h-2" />
            <p className="text-center text-muted-foreground">{statusMessage}</p>
          </div>
          
          <div className="flex justify-center">
            <div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
