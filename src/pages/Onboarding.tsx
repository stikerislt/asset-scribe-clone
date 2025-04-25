
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { TenantSetupDialog } from "@/components/tenant/TenantSetupDialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Onboarding() {
  const [showDialog, setShowDialog] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  // If no user is logged in, redirect to login
  if (!user) {
    console.log("[Onboarding] No user session, redirecting to login");
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
