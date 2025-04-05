
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CSVPreview } from "./ImportAssetsPreview";

interface ImportAssetsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: {
    headers: string[];
    data: string[][];
    fileType: 'csv' | 'excel';
  };
}

export const ImportAssetsDialog = ({ isOpen, onClose, previewData }: ImportAssetsDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogTitle>Import Assets</DialogTitle>
        <CSVPreview
          headers={previewData.headers}
          data={previewData.data}
          fileType={previewData.fileType}
          onCancel={onClose}
          onConfirm={() => {
            // This will be handled by the parent component
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
