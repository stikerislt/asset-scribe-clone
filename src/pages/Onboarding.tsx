
import { useState, useEffect, useRef } from "react";
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
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset the check timeout when component unmounts
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  const checkOnboardingStatus = async () => {
    if (!user) {
      console.log("[Onboarding] No user found, will redirect to login");
      setIsChecking(false);
      return;
    }
    
    setIsChecking(true);
    setCheckError(null);
    
    // Set a 15-second timeout for the entire check process
    checkTimeoutRef.current = setTimeout(() => {
      console.log("[Onboarding] Overall onboarding check timed out after 15 seconds");
      setIsChecking(false);
      setCheckError("Check timed out. Please try again or continue with organization setup.");
      setShowDialog(true);
    }, 15000);
    
    try {
      console.log("[Onboarding] Checking onboarding status for user:", user.id);
      
      // First try to check if user has any primary tenant memberships
      // This is a faster and more reliable way to determine if onboarding is complete
      console.log("[Onboarding] Checking tenant memberships");
      try {
        const { data: memberships, error: membershipError } = await supabase
          .from('tenant_memberships')
          .select('id, tenant_id')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .limit(1)
          .maybeSingle();
        
        if (membershipError) {
          console.warn("[Onboarding] Error checking tenant memberships:", membershipError);
          // Continue to fallback method
        } else if (memberships) {
          console.log("[Onboarding] User has a primary tenant membership:", memberships);
          
          // Clear the timeout since we're done
          if (checkTimeoutRef.current) {
            clearTimeout(checkTimeoutRef.current);
            checkTimeoutRef.current = null;
          }
          
          setIsChecking(false);
          navigate("/dashboard");
          return;
        } else {
          console.log("[Onboarding] No primary tenant found for user");
        }
      } catch (membershipCheckError) {
        console.error("[Onboarding] Error during membership check:", membershipCheckError);
        // Continue to next check
      }
      
      // Try backup: direct check on profiles table
      console.log("[Onboarding] Checking profiles table");
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .maybeSingle();
          
        if (profileError) {
          console.error("[Onboarding] Error checking profile:", profileError);
        } else if (profileData?.onboarding_completed) {
          console.log("[Onboarding] Profile shows onboarding completed");
          
          // Clear the timeout since we're done
          if (checkTimeoutRef.current) {
            clearTimeout(checkTimeoutRef.current);
            checkTimeoutRef.current = null;
          }
          
          setIsChecking(false);
          navigate("/dashboard");
          return;
        } else {
          console.log("[Onboarding] Profile exists but onboarding not completed");
        }
      } catch (profileCheckError) {
        console.error("[Onboarding] Error during profile check:", profileCheckError);
      }
      
      // If we got here, the user needs to complete onboarding
      console.log("[Onboarding] User needs to complete onboarding - showing dialog");
      
      // Clear the timeout since we're done with checks
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }
      
      setIsChecking(false);
      setShowDialog(true);
    } catch (error: any) {
      console.error("[Onboarding] Error checking onboarding status:", error);
      
      // Clear the timeout since we're done
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }
      
      setCheckError(error.message || "An unknown error occurred");
      setIsChecking(false);
      setShowDialog(true); // Show dialog as fallback
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

  if (!user) {
    console.log("[Onboarding] No user session, redirecting to login");
    return <Navigate to="/auth/login" replace />;
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Checking onboarding status...</p>
          <p className="text-sm text-muted-foreground">User ID: {user.id}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Clear the timeout if it exists
              if (checkTimeoutRef.current) {
                clearTimeout(checkTimeoutRef.current);
                checkTimeoutRef.current = null;
              }
              setIsChecking(false);
              setShowDialog(true);
            }}
          >
            Skip Check & Continue Setup
          </Button>
        </div>
      </div>
    );
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
      <TenantSetupDialog 
        isOpen={showDialog} 
        onComplete={() => {
          setShowDialog(false);
          navigate("/dashboard");
        }}
      />
    </div>
  );
}
