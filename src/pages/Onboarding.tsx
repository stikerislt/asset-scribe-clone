
import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { TenantSetupDialog } from "@/components/tenant/TenantSetupDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Onboarding() {
  const [showDialog, setShowDialog] = useState(true); // Set to true by default
  const [isValidating, setIsValidating] = useState(false); // Start with false to avoid blocking UI
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  console.log("[Onboarding] Initial render state:", { 
    showDialog, 
    isValidating, 
    loading,
    userId: user?.id 
  });

  const validateProfile = async () => {
    if (!user?.id) {
      console.log("[Onboarding] No user ID available, cannot validate profile");
      setIsValidating(false);
      return;
    }

    setIsValidating(true);
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

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // If onboarding is completed, redirect to dashboard
      if (profile?.onboarding_completed) {
        console.log("[Onboarding] User has completed onboarding, redirecting to dashboard");
        navigate("/dashboard");
        return;
      }

      // Show dialog if onboarding is not completed
      console.log("[Onboarding] User has not completed onboarding, ensuring dialog is shown");
      setShowDialog(true); // Ensure dialog is shown
    } catch (error: any) {
      console.error("[Onboarding] Profile validation error:", error);
      toast.error("Failed to validate user profile. Please try refreshing the page.");
      // Show dialog anyway in case of error
      setShowDialog(true);
    } finally {
      console.log("[Onboarding] Setting isValidating to false");
      setIsValidating(false);
    }
  };

  useEffect(() => {
    console.log("[Onboarding] Component state in effect:", {
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

  // Force dialog to show after a small delay if still not showing
  useEffect(() => {
    if (user && !loading && !isValidating && !showDialog) {
      console.log("[Onboarding] Dialog not showing after validation, forcing it to show");
      const timer = setTimeout(() => {
        setShowDialog(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, loading, isValidating, showDialog]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your account...</p>
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

  console.log("[Onboarding] Final render state:", { 
    showDialog, 
    isValidating, 
    userId: user?.id 
  });

  // Always show the dialog if we have a user and we're not loading
  return (
    <div className="min-h-screen bg-background">
      <TenantSetupDialog 
        isOpen={showDialog} 
        onComplete={handleComplete}
      />
    </div>
  );
}
