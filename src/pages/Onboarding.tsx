
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { TenantSetupDialog } from "@/components/tenant/TenantSetupDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Onboarding() {
  const [showDialog, setShowDialog] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const validateProfile = async () => {
    if (!user?.id) {
      setIsValidating(false);
      return;
    }

    try {
      console.log("[Onboarding] Checking profile for user:", user.id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();
        
      console.log("[Onboarding] Profile check result:", { 
        profile, 
        error: profileError,
        hasProfile: !!profile,
        onboardingCompleted: profile?.onboarding_completed
      });

      if (profileError) {
        throw profileError;
      }

      // If onboarding is completed, redirect to dashboard
      if (profile?.onboarding_completed) {
        console.log("[Onboarding] User has completed onboarding, redirecting to dashboard");
        navigate("/dashboard");
        return;
      }

      // Show dialog if onboarding is not completed
      console.log("[Onboarding] User has not completed onboarding, showing dialog");
      setShowDialog(true);
    } catch (error: any) {
      console.error("[Onboarding] Profile validation error:", error);
      toast.error("Failed to validate user profile. Please try refreshing the page.");
    } finally {
      console.log("[Onboarding] Setting isValidating to false");
      setIsValidating(false);
    }
  };

  useEffect(() => {
    console.log("[Onboarding] Component state:", {
      loading,
      userId: user?.id,
      isValidating,
      showDialog
    });
    
    if (loading) {
      console.log("[Onboarding] Still loading auth state");
      return;
    }
    
    if (!user) {
      console.log("[Onboarding] No user found, redirecting to login");
      navigate("/auth/login");
      return;
    }

    validateProfile();
  }, [user, loading]);

  if (loading || isValidating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Preparing your setup...</p>
          <p className="text-sm text-muted-foreground mt-2">
            {loading ? "Loading your account..." : "Validating your profile..."}
          </p>
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

  console.log("[Onboarding] Rendering with state:", { 
    showDialog, 
    isValidating, 
    userId: user?.id 
  });

  return (
    <div className="min-h-screen bg-background">
      <TenantSetupDialog 
        isOpen={showDialog} 
        onComplete={handleComplete}
      />
    </div>
  );
}
