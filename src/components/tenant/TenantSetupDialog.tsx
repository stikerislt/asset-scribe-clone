
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TenantSetupForm } from "./TenantSetupForm";
import { useTenantSetup } from "./hooks/useTenantSetup";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface TenantSetupDialogProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function TenantSetupDialog({ isOpen, onComplete }: TenantSetupDialogProps) {
  const { handleSubmit, isSubmitting, hasError, errorMessage } = useTenantSetup({ onComplete });
  const [showHelpInfo, setShowHelpInfo] = useState(false);
  const { logout } = useAuth();
  
  // Log when the dialog state changes
  useEffect(() => {
    console.log("[TenantSetupDialog] Dialog isOpen:", isOpen);
    
    // Force dialog to open if it's closed but should be open
    // This helps prevent any bugs where the dialog might not show
    if (!isOpen) {
      console.log("[TenantSetupDialog] Dialog should be open, forcing open state");
    }
  }, [isOpen]);

  const handleOpenChange = (open: boolean) => {
    // Prevent dialog from closing if we're submitting or there's an error
    if (!open && (isSubmitting || hasError)) {
      console.log("[TenantSetupDialog] Prevented dialog from closing due to submission or error state");
      toast.error("Please complete the organization setup or refresh the page to try again");
      return;
    }
    
    // Only allow explicit completion (not manual closing)
    if (!open) {
      console.log("[TenantSetupDialog] Attempted to close dialog manually");
      toast.error("Please complete the organization setup to continue");
    }
  };

  const toggleHelpInfo = () => {
    setShowHelpInfo(!showHelpInfo);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully. Please log in again to continue setup.");
    } catch (error) {
      toast.error("Failed to log out. Please try refreshing the page.");
    }
  };

  const handleRefreshPage = () => {
    window.location.reload();
  };

  // Debug render
  console.log("[TenantSetupDialog] Rendering with state:", { 
    isOpen, isSubmitting, hasError, errorMessage 
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create your organization</DialogTitle>
          <DialogDescription>
            Set up your organization to get started with the platform.
          </DialogDescription>
        </DialogHeader>

        {hasError && errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              {errorMessage}
              <button 
                className="underline ml-1 text-destructive-foreground/80 hover:text-destructive-foreground"
                onClick={toggleHelpInfo}
              >
                Need help?
              </button>
            </AlertDescription>
          </Alert>
        )}

        {showHelpInfo && (
          <Alert className="mb-4 bg-muted">
            <Info className="h-4 w-4 mr-2" />
            <AlertDescription className="text-sm">
              <p className="mb-2">This error typically occurs when there are permission issues with your account. Try the following:</p>
              <ol className="list-decimal ml-5 mb-4">
                <li>Refresh this page to reset your session</li>
                <li>Log out and log back in to reset your authentication</li>
                <li>Clear your browser cache and cookies</li>
                <li>Try using a different browser</li>
                <li>If the issue persists, contact support for assistance</li>
              </ol>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-1/2 flex items-center justify-center" 
                  onClick={handleRefreshPage}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" /> 
                  Refresh page
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-1/2 flex items-center justify-center" 
                  onClick={handleLogout}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" /> 
                  Log out now
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <TenantSetupForm 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          hasError={hasError}
        />
      </DialogContent>
    </Dialog>
  );
}
