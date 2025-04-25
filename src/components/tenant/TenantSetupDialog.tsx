
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TenantSetupForm } from "./TenantSetupForm";
import { useTenantSetup } from "./hooks/useTenantSetup";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface TenantSetupDialogProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function TenantSetupDialog({ isOpen, onComplete }: TenantSetupDialogProps) {
  const { handleSubmit, isSubmitting, hasError, errorMessage } = useTenantSetup({ onComplete });
  const [showHelpInfo, setShowHelpInfo] = useState(false);

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
              {errorMessage.includes("permissions") && (
                <button 
                  className="underline ml-1 text-destructive-foreground/80 hover:text-destructive-foreground"
                  onClick={toggleHelpInfo}
                >
                  Need help?
                </button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {showHelpInfo && (
          <Alert className="mb-4 bg-muted">
            <Info className="h-4 w-4 mr-2" />
            <AlertDescription className="text-sm">
              <p className="mb-2">This error typically occurs when there are permission issues with your account. Try the following:</p>
              <ol className="list-decimal ml-5">
                <li>Log out and log back in to reset your session</li>
                <li>Clear your browser cache and cookies</li>
                <li>Try using a different browser</li>
                <li>If the issue persists, contact support for assistance</li>
              </ol>
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
