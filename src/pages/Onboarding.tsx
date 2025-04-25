
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
    const validateAuthStatus = async () => {
      if (loading) return;
      
      if (!user) {
        console.log("[Onboarding] No user session, redirecting to login");
        navigate("/auth/login");
        return;
      }
      
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData.session) {
          console.error("[Onboarding] Session validation error:", sessionError || "No session found");
          toast.error("Authentication session expired. Please log in again.");
          navigate("/auth/login");
          return;
        }
        
        console.log("[Onboarding] Session validation passed:", sessionData.session.user.id);
        
        // Ensure user has a profile record
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error("[Onboarding] Profile check error:", profileError);
        }
        
        if (!profile) {
          console.log("[Onboarding] Profile not found, creating one");
          
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
              onboarding_completed: false
            });
            
          if (createError) {
            console.error("[Onboarding] Failed to create profile:", createError);
          }
        }
      } catch (error) {
        console.error("[Onboarding] Auth validation error:", error);
      } finally {
        setIsValidating(false);
      }
    };
    
    validateAuthStatus();
  }, [user, loading, navigate]);

  // If still validating auth, show loading
  if (loading || isValidating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Preparing your setup...</p>
        </div>
      </div>
    );
  }

  // If no user is logged in, redirect to login
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  console.log("[Onboarding] Page loaded with user:", user.id);

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
