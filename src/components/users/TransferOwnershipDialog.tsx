
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle } from 'lucide-react';
import { EnhancedUser } from '@/types/user';

interface TransferOwnershipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedUser: EnhancedUser | null;
  isTransferring: boolean;
}

export const TransferOwnershipDialog = ({
  isOpen,
  onClose,
  onConfirm,
  selectedUser,
  isTransferring
}: TransferOwnershipDialogProps) => {
  if (!selectedUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
            Transfer Ownership
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to transfer ownership of this organization to {selectedUser.name}?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="font-medium">New owner details:</p>
          <div className="mt-2 border rounded-md p-3 bg-slate-50">
            <p><span className="text-sm text-slate-500">Name:</span> {selectedUser.name}</p>
            <p><span className="text-sm text-slate-500">Email:</span> {selectedUser.email}</p>
            <p><span className="text-sm text-slate-500">Role:</span> {selectedUser.dbRole}</p>
          </div>
          <p className="mt-4 text-sm text-red-500">
            Warning: You will no longer be the owner of this organization after this action.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isTransferring}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm} 
            disabled={isTransferring}
          >
            {isTransferring ? 'Transferring...' : 'Transfer Ownership'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
