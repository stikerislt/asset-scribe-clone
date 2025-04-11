
import { useState, useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import AuthCard from "@/components/auth/AuthCard";

const Auth = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot-password">("login");

  useEffect(() => {
    if (location.pathname === "/auth/signup") {
      setAuthMode("signup");
    } else if (location.pathname === "/auth/forgot-password") {
      setAuthMode("forgot-password");
    } else {
      setAuthMode("login");
    }
  }, [location.pathname]);

  if (user) {
    const from = location.state?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }

  const toggleMode = () => {
    if (authMode === "login") {
      setAuthMode("signup");
    } else {
      setAuthMode("login");
    }
  };

  const showForgotPassword = () => {
    setAuthMode("forgot-password");
  };

  const showLogin = () => {
    setAuthMode("login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <AuthCard 
        isLogin={authMode === "login"} 
        onToggleMode={authMode !== "forgot-password" ? toggleMode : undefined}
      >
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
};

export default Auth;
