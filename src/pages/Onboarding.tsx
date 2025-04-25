
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { TenantSetupDialog } from "@/components/tenant/TenantSetupDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

export default function Onboarding() {
  const [showDialog, setShowDialog] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const [checkError, setCheckError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const checkOnboardingStatus = async () => {
    if (!user) {
      console.log("[Onboarding] No user found, will redirect to login");
      setIsChecking(false);
      return;
    }
    
    setIsChecking(true);
    setCheckError(null);
    
    try {
      console.log("[Onboarding] Checking onboarding status for user:", user.id);
      
      // First try to check if user has any primary tenant memberships
      // This is a faster and more reliable way to determine if onboarding is complete
      const { data: memberships, error: membershipError } = await supabase
        .from('tenant_memberships')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .limit(1)
        .maybeSingle();
      
      if (membershipError) {
        console.warn("[Onboarding] Error checking tenant memberships:", membershipError);
        // Continue to fallback method
      } else if (memberships) {
        console.log("[Onboarding] User has a primary tenant membership, redirecting to dashboard");
        navigate("/dashboard");
        return;
      }
      
      // Fallback: Try RPC method with 5 second timeout
      console.log("[Onboarding] No primary tenant found, trying RPC method");
      
      // Add explicit timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out")), 5000)
      );
      
      const fetchPromise = supabase.rpc('has_completed_onboarding', {
        user_id: user.id
      });
      
      // Race between the fetch and the timeout
      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise.then(() => { 
          throw new Error("Request timed out after 5 seconds");
        })
      ]) as any;
      
      if (error) {
        console.error("[Onboarding] Error checking onboarding status with RPC:", error);
        
        // If RPC fails, fall back to checking profiles table directly
        console.log("[Onboarding] Falling back to direct profile check");
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .maybeSingle();
          
        if (profileError) {
          console.error("[Onboarding] Error checking profile:", profileError);
          throw profileError;
        }
        
        if (profileData?.onboarding_completed) {
          console.log("[Onboarding] Profile shows onboarding completed, redirecting to dashboard");
          navigate("/dashboard");
          return;
        }
        
        // If we get here, the user needs to complete onboarding
        console.log("[Onboarding] User needs to complete onboarding (via profile check)");
        setShowDialog(true);
      } else {
        console.log("[Onboarding] Onboarding status response from RPC:", data);
        
        if (data === true) {
          console.log("[Onboarding] User has completed onboarding via RPC, redirecting to dashboard");
          navigate("/dashboard");
        } else {
          console.log("[Onboarding] User needs to complete onboarding (via RPC)");
          setShowDialog(true);
        }
      }
    } catch (error: any) {
      console.error("[Onboarding] Error checking onboarding status:", error);
      
      // Last resort: Just show the dialog if we can't determine status
      if (error.message && error.message.includes("timed out")) {
        console.log("[Onboarding] Timeout occurred, showing dialog as fallback");
        setShowDialog(true);
        setCheckError("Could not verify your onboarding status. Please complete the organization setup.");
      } else {
        setCheckError(error.message || "An unknown error occurred");
        toast.error("An error occurred checking onboarding status. Please try again.");
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Use a small delay to ensure auth state is fully loaded
    const timer = setTimeout(() => {
      console.log("[Onboarding] Starting onboarding check for user:", user?.id);
      checkOnboardingStatus();
    }, 500);

    return () => clearTimeout(timer);
  }, [user, navigate]);

  // Add debug render logging
  console.log("[Onboarding] Rendering with state:", { 
    showDialog, isChecking, checkError, hasUser: !!user 
  });

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Checking onboarding status...</p>
          <p className="text-sm text-muted-foreground">User ID: {user?.id || "Not authenticated"}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("[Onboarding] No user session, redirecting to login");
    return <Navigate to="/auth/login" replace />;
  }

  if (checkError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 max-w-md mx-auto p-6 border rounded-md shadow-sm">
          <div className="text-destructive mb-4">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Error Checking Onboarding Status</h2>
          <p className="text-center text-muted-foreground mb-4">{checkError}</p>
          <div className="flex gap-3 w-full">
            <Button 
              onClick={() => {
                setIsChecking(true);
                setCheckError(null);
                checkOnboardingStatus();
              }}
              className="flex-1"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button 
              onClick={() => setShowDialog(true)} 
              variant="outline"
              className="flex-1"
            >
              Continue to Setup
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If we get here, we should show the tenant setup dialog
  return (
    <div className="min-h-screen bg-background">
      {showDialog ? (
        <TenantSetupDialog 
          isOpen={showDialog} 
          onComplete={() => {
            setShowDialog(false);
            navigate("/dashboard");
          }}
        />
      ) : (
        <div className="flex items-center justify-center min-h-screen">
          <Button 
            onClick={() => setShowDialog(true)}
            variant="default"
          >
            Complete Organization Setup
          </Button>
        </div>
      )}
    </div>
  );
}
