
import { useState, useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import AuthCard from "@/components/auth/AuthCard";

const Auth = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    if (location.pathname === "/auth/signup") {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [location.pathname]);

  if (user) {
    const from = location.state?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <AuthCard isLogin={isLogin} onToggleMode={toggleMode}>
        {isLogin ? <LoginForm /> : <SignupForm />}
      </AuthCard>
    </div>
  );
};

export default Auth;
