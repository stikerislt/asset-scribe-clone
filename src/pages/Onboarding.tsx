
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { TenantSetupDialog } from "@/components/tenant/TenantSetupDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Onboarding() {
  const [showDialog, setShowDialog] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) {
        console.log("[Onboarding] No user found, redirecting to login");
        setIsChecking(false);
        return;
      }
      
      console.log("[Onboarding] Checking onboarding status for user:", user.id);
      
      try {
        const { data, error } = await supabase.rpc('has_completed_onboarding', {
          user_id: user.id
        });
        
        if (error) {
          console.error("[Onboarding] Error checking onboarding status:", error);
          toast.error("Failed to check onboarding status");
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
      } catch (error) {
        console.error("[Onboarding] Error:", error);
        toast.error("An error occurred. Please try again.");
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, [user, navigate]);

  // If still checking or no user, show loading
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

  const handleComplete = () => {
    console.log("[Onboarding] Onboarding completed");
    setShowDialog(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <TenantSetupDialog 
        isOpen={showDialog} 
        onComplete={handleComplete} 
      />
    </div>
  );
}
