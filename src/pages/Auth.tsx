
import { useState, useEffect } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import AuthCard from "@/components/auth/AuthCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot-password">("login");
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    // Check for auth errors in URL hash params (from email verification)
    const checkHashParams = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const error = hashParams.get('error_description');
      const type = hashParams.get('type');
      
      // If there's an error in the URL
      if (error === 'Email link is invalid or has expired') {
        setVerificationError('The verification link has expired. Please request a new one.');
      }
      
      // Clear the URL hash params after reading them
      if (error || type) {
        // Clear the hash without reloading the page
        window.history.replaceState(null, '', location.pathname + location.search);
      }
    };
    
    checkHashParams();
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (location.pathname === "/auth/signup") {
      setAuthMode("signup");
    } else if (location.pathname === "/auth/forgot-password") {
      setAuthMode("forgot-password");
    } else {
      setAuthMode("login");
    }
  }, [location.pathname]);

  // If user is authenticated, redirect to dashboard or onboarding
  if (user) {
    const checkOnboardingStatus = async () => {
      try {
        const { data, error } = await supabase.rpc('has_completed_onboarding', {
          user_id: user.id
        });
        
        if (error) throw error;
        
        // Redirect based on onboarding status
        if (data) {
          return "/dashboard";
        } else {
          return "/onboarding";
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        // Default to onboarding if there's an error
        return "/onboarding";
      }
    };
    
    // Use from location state if available, otherwise check onboarding status
    const from = location.state?.from?.pathname || "/onboarding";
    return <Navigate to={from} replace />;
  }

  const resendVerificationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) throw error;
      
      toast.success("Verification email resent. Please check your inbox and spam folder.");
      setVerificationError(null);
    } catch (error: any) {
      toast.error("Failed to resend verification email: " + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <AuthCard 
        isLogin={authMode === "login"} 
        onToggleMode={authMode !== "forgot-password" ? toggleMode : undefined}
      >
        {verificationError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              {verificationError}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const email = localStorage.getItem('pendingVerificationEmail');
                  if (email) {
                    resendVerificationEmail(email);
                  } else {
                    toast.error("Email address not found. Please try signing up again.");
                  }
                }}
              >
                Resend Email
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {authMode === "login" && <LoginForm onForgotPassword={showForgotPassword} />}
        {authMode === "signup" && <SignupForm />}
        {authMode === "forgot-password" && (
          <div className="space-y-4">
            <ForgotPasswordForm />
            <div className="text-center">
              <button 
                onClick={showLogin} 
                className="text-sm text-primary hover:underline"
              >
                Back to login
              </button>
            </div>
          </div>
        )}
      </AuthCard>
    </div>
  );

  function toggleMode() {
    if (authMode === "login") {
      setAuthMode("signup");
      navigate("/auth/signup", { replace: true });
    } else {
      setAuthMode("login");
      navigate("/auth/login", { replace: true });
    }
  }

  function showForgotPassword() {
    setAuthMode("forgot-password");
    navigate("/auth/forgot-password", { replace: true });
  }

  function showLogin() {
    setAuthMode("login");
    navigate("/auth/login", { replace: true });
  }
};

export default Auth;
