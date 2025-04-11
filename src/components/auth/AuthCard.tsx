
import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AuthCardProps {
  isLogin: boolean;
  onToggleMode?: () => void;
  children: ReactNode;
}

const AuthCard = ({ isLogin, onToggleMode, children }: AuthCardProps) => {
  const getTitle = () => {
    if (onToggleMode === undefined) return "Reset Password";
    return isLogin ? "Sign In" : "Create Account";
  };

  const getDescription = () => {
    if (onToggleMode === undefined) return "Reset your password";
    return isLogin 
      ? "Enter your credentials to access your account" 
      : "Fill out the form below to create an account";
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{getTitle()}</CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      {onToggleMode && (
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={onToggleMode}>
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default AuthCard;
