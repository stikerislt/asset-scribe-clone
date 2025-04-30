
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WarehouseItemForm } from "./WarehouseItemForm";
import type { WarehouseItemFormValues } from "./WarehouseItemForm";

interface WarehouseItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultValues?: Partial<WarehouseItemFormValues>;
  isEdit?: boolean;
  itemId?: string;
}

export function WarehouseItemDialog({
  isOpen,
  onClose,
  onSuccess,
  defaultValues,
  isEdit = false,
  itemId,
}: WarehouseItemDialogProps) {
  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Warehouse Item" : "Add Warehouse Item"}
          </DialogTitle>
        </DialogHeader>
        <WarehouseItemForm
          onSuccess={handleSuccess}
          onCancel={onClose}
          defaultValues={defaultValues}
          isEdit={isEdit}
          itemId={itemId}
        />
      </DialogContent>
    </Dialog>
  );
}
