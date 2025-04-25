
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import UpdatePasswordForm from "@/components/auth/UpdatePasswordForm";

const UpdatePassword = () => {
  const [isInviteFlow, setIsInviteFlow] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check URL hash for invitation type
    const hash = window.location.hash;
    if (hash.includes("type=invite")) {
      setIsInviteFlow(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isInviteFlow ? "Welcome to the team!" : "Update Password"}</CardTitle>
          <CardDescription>
            {isInviteFlow 
              ? "Please create a password to complete your account setup" 
              : "Enter your new password below"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpdatePasswordForm isInviteFlow={isInviteFlow} />
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePassword;
