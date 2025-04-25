
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { TenantSetupDialog } from "@/components/tenant/TenantSetupDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Onboarding() {
  const [showDialog, setShowDialog] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) {
        console.log("[Onboarding] No user found, redirecting to login");
        return;
      }
      
      console.log("[Onboarding] Checking onboarding status for user:", user.id);
      
      const { data, error } = await supabase.rpc('has_completed_onboarding', {
        user_id: user.id
      });
      
      if (error) {
        console.error("[Onboarding] Error checking onboarding status:", error);
        toast.error("Failed to check onboarding status");
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
    };

    checkOnboarding();
  }, [user, navigate]);

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
