
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { EnhancedUser } from "@/types/user";

interface TransferOwnershipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedUser: EnhancedUser | null;
  isTransferring: boolean;
}

export function TransferOwnershipDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedUser,
  isTransferring
}: TransferOwnershipDialogProps) {
  if (!selectedUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Ownership</DialogTitle>
          <DialogDescription>
            Are you sure you want to transfer ownership to {selectedUser.name}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <div className="flex items-center space-x-2 text-yellow-600">
            <Crown className="h-5 w-5" />
            <span className="text-sm">
              The new owner will have full control over this organization.
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isTransferring}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isTransferring}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {isTransferring ? 'Transferring...' : 'Transfer Ownership'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
