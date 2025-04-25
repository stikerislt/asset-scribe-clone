import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Otherwise, mark onboarding as completed and redirect to dashboard
  const completeOnboarding = async () => {
    try {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
    } catch (error) {
      console.error("Error updating onboarding status:", error);
    }
    
    navigate("/dashboard");
  };

  // Execute onboarding completion
  completeOnboarding();

  return null;
}
