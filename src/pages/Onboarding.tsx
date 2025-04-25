
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { TenantSetupDialog } from "@/components/tenant/TenantSetupDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Onboarding() {
  const [showDialog, setShowDialog] = useState(true);
  const [isValidating, setIsValidating] = useState(true);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const validateProfile = async () => {
    try {
      console.log("[Onboarding] Checking profile for user:", user?.id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
        
      console.log("[Onboarding] Profile check result:", { 
        profile, 
        error: profileError,
        errorCode: profileError?.code,
        userId: user?.id 
      });

      // Check if the profile exists and has completed onboarding
      if (profile?.onboarding_completed) {
        console.log("[Onboarding] User has already completed onboarding, redirecting to dashboard");
        navigate("/dashboard");
        return;
      }

      setShowDialog(true);
    } catch (error: any) {
      console.error("[Onboarding] Profile validation error:", error);
      toast.error("Failed to validate user profile");
    } finally {
      setIsValidating(false);
    }
  };

  // Effect to handle auth state and profile validation
  useEffect(() => {
    console.log("[Onboarding] Starting validation with state:", {
      loading,
      userId: user?.id,
      isValidating
    });
    
    if (loading) {
      console.log("[Onboarding] Still loading auth state, skipping validation");
      return;
    }
    
    if (!user) {
      console.log("[Onboarding] No user session, redirecting to login");
      navigate("/auth/login");
      return;
    }

    validateProfile();
  }, [user, loading, navigate]);

  if (loading || isValidating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Preparing your setup...</p>
          <p className="text-sm text-muted-foreground mt-2">Validating your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const handleComplete = () => {
    console.log("[Onboarding] Setup completed, navigating to dashboard");
    setShowDialog(false);
    navigate("/dashboard");
  };

  console.log("[Onboarding] Rendering with state:", { showDialog, isValidating, userId: user?.id });

  return (
    <div className="min-h-screen bg-background">
      <TenantSetupDialog 
        isOpen={showDialog} 
        onComplete={handleComplete}
      />
    </div>
  );
}
