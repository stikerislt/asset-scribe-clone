
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TenantSetupForm } from "./TenantSetupForm";
import { useTenantSetup } from "./hooks/useTenantSetup";

interface TenantSetupDialogProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function TenantSetupDialog({ isOpen, onComplete }: TenantSetupDialogProps) {
  const { handleSubmit, isSubmitting, hasError } = useTenantSetup({ onComplete });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !hasError) {
        console.log("[TenantSetupDialog] Attempted to close dialog");
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create your organization</DialogTitle>
          <DialogDescription>
            Set up your organization to get started with the platform.
          </DialogDescription>
        </DialogHeader>

        <TenantSetupForm 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          hasError={hasError}
        />
      </DialogContent>
    </Dialog>
  );
}
