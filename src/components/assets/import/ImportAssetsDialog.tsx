
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImportAssetsPreview } from "./ImportAssetsPreview";

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
        <ImportAssetsPreview
          headers={previewData.headers}
          data={previewData.data}
          fileType={previewData.fileType}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};
