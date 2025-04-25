
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

  // Validate auth status when component loads
  useEffect(() => {
    let isMounted = true;

    const validateAuthStatus = async () => {
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
      
      try {
        // Force refresh the session
        const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
        console.log("[Onboarding] Session refresh result:", { 
          success: !!sessionData.session,
          error: sessionError,
          userId: sessionData.session?.user?.id 
        });
        
        if (sessionError || !sessionData.session) {
          console.error("[Onboarding] Session validation error:", sessionError || "No session found");
          toast.error("Authentication session expired. Please log in again.");
          navigate("/auth/login");
          return;
        }
        
        // Ensure user has a profile record
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        console.log("[Onboarding] Profile check result:", { 
          profile, 
          error: profileError,
          errorCode: profileError?.code,
          userId: user.id 
        });

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error("[Onboarding] Profile check error:", profileError);
          throw new Error("Failed to verify user profile");
        }
        
        if (!profile) {
          console.log("[Onboarding] Creating new profile for user:", user.id);
          
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
              onboarding_completed: false
            });
            
          if (createError) {
            console.error("[Onboarding] Failed to create profile:", {
              error: createError,
              code: createError.code,
              details: createError.details
            });
            throw new Error("Failed to create user profile");
          }
          
          console.log("[Onboarding] Profile created successfully");
        }
      } catch (error: any) {
        console.error("[Onboarding] Auth validation error:", {
          error,
          message: error.message,
          stack: error.stack
        });
        toast.error(error.message || "Failed to validate user session");
        navigate("/auth/login");
      } finally {
        if (isMounted) {
          setIsValidating(false);
        }
      }
    };
    
    validateAuthStatus();
    return () => {
      isMounted = false;
    };
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

  return (
    <div className="min-h-screen bg-background">
      <TenantSetupDialog 
        isOpen={showDialog} 
        onComplete={handleComplete}
      />
    </div>
  );
}
