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

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) {
        console.log("[Onboarding] No user found, redirecting to login");
        setIsChecking(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.rpc('has_completed_onboarding', {
          user_id: user.id
        });
        
        if (error) {
          console.error("[Onboarding] Error checking onboarding status:", error);
          setCheckError(error.message);
          toast.error("Failed to check onboarding status: " + error.message);
          setIsChecking(false);
          return;
        }
        
        console.log("[Onboarding] Onboarding status:", data);
        
        if (data) {
          console.log("[Onboarding] User has completed onboarding, redirecting to dashboard");
          navigate("/dashboard");
        } else {
          console.log("[Onboarding] User needs to complete onboarding");
          setShowDialog(true);
        }
      } catch (error: any) {
        console.error("[Onboarding] Error:", error);
        setCheckError(error.message);
        toast.error("An error occurred checking onboarding status. Please try again.");
      } finally {
        setIsChecking(false);
      }
    };

    const timer = setTimeout(() => {
      checkOnboarding();
    }, 500);

    return () => clearTimeout(timer);
  }, [user, navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Checking onboarding status...</p>
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
        <div className="flex flex-col items-center gap-4 max-w-md mx-auto p-6">
          <div className="text-destructive mb-4">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Error Checking Onboarding Status</h2>
          <p className="text-center text-muted-foreground">{checkError}</p>
          <Button 
            onClick={() => {
              setIsChecking(true);
              setCheckError(null);
              window.location.reload();
            }}
            variant="outline"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

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
