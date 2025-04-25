
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { TenantSetupDialog } from "@/components/tenant/TenantSetupDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function Onboarding() {
  const [showDialog, setShowDialog] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has already completed onboarding
    const checkOnboarding = async () => {
      if (!user) return;
      
      const { data, error } = await supabase.rpc('has_completed_onboarding', {
        user_id: user.id
      });
      
      if (error) {
        console.error("Error checking onboarding status:", error);
        return;
      }
      
      if (data) {
        navigate("/dashboard");
      }
    };

    checkOnboarding();
  }, [user, navigate]);

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const handleComplete = () => {
    setShowDialog(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <TenantSetupDialog isOpen={showDialog} onComplete={handleComplete} />
    </div>
  );
}
