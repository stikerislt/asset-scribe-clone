
import { useState } from "react";
import { CSVPreview } from "@/components/CSVPreview";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { importEmployeesFromCSV } from "@/lib/api/employees";

interface ImportEmployeesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  headers: string[];
  data: string[][];
  onImportComplete?: () => void;
}

export const ImportEmployeesDialog = ({
  isOpen,
  onOpenChange,
  headers,
  data,
  onImportComplete
}: ImportEmployeesDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirmImport = async () => {
    setIsLoading(true);
    try {
      await importEmployeesFromCSV(headers, data);
      toast({
        title: "Import successful",
        description: `${data.length} employees have been imported.`,
      });
      onImportComplete?.();
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An error occurred while importing employees.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        <CSVPreview 
          headers={headers}
          data={data}
          onConfirm={handleConfirmImport}
          onCancel={() => onOpenChange(false)}
          loading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};
