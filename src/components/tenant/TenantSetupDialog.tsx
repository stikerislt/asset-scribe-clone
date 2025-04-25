
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TenantSetupForm } from "./TenantSetupForm";
import { useTenantSetup } from "./hooks/useTenantSetup";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface TenantSetupDialogProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function TenantSetupDialog({ isOpen, onComplete }: TenantSetupDialogProps) {
  const { handleSubmit, isSubmitting, hasError, errorMessage } = useTenantSetup({ onComplete });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Prevent dialog from closing if we're submitting or there's an error
      if (!open && (isSubmitting || hasError)) {
        console.log("[TenantSetupDialog] Prevented dialog from closing due to submission or error state");
        return;
      }
      
      // Only allow explicit completion (not manual closing)
      if (!open) {
        console.log("[TenantSetupDialog] Attempted to close dialog manually");
      }
    }}>
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
