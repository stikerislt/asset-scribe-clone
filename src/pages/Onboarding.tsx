
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
        
        // Call our edge function to create a tenant
        const supabaseUrl = "https://tbefdkwtjpbonuunxytk.supabase.co";
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error("No valid session found. Please log in again.");
        }
        
        const createTenantResponse = await fetch(
          `${supabaseUrl}/functions/v1/create-tenant-for-user`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              tenant_name: 'My Organization',
              org_size: 'small',
              org_industry: 'Other'
            })
          }
        );
        
        if (!createTenantResponse.ok) {
          const errorData = await createTenantResponse.json();
          throw new Error(`Failed to create organization: ${errorData.error || createTenantResponse.statusText}`);
        }
        
        const tenantData = await createTenantResponse.json();
        console.log("Tenant created:", tenantData);
        
        setProgressValue(90);
        setStatusMessage("Finalizing account setup...");
        
        // Step 3: Mark onboarding as completed
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
