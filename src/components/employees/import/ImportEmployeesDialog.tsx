
import { useState } from "react";
import { CSVPreview } from "@/components/CSVPreview";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { importEmployeesFromCSV } from "@/lib/api/employees";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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

  // Check if required columns exist
  const hasNameColumn = headers.some(h => h.toLowerCase() === 'name');
  const hasEmailColumn = headers.some(h => h.toLowerCase() === 'email');
  const isValidFormat = hasNameColumn && hasEmailColumn;

  const handleConfirmImport = async () => {
    if (!isValidFormat) {
      toast({
        title: "Invalid format",
        description: "The CSV file must contain both 'name' and 'email' columns.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const results = await importEmployeesFromCSV(headers, data);
      
      // Count created vs. updated records
      const created = results.filter(r => r.created).length;
      const updated = results.length - created;
      
      let message = `Successfully imported ${results.length} employees.`;
      if (created > 0) {
        message += ` Created ${created} new records.`;
      }
      if (updated > 0) {
        message += ` Updated ${updated} existing records.`;
      }
      
      toast({
        title: "Import successful",
        description: message,
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
        {!isValidFormat && (
          <Alert variant="destructive" className="mb-4 mx-4 mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invalid Format</AlertTitle>
            <AlertDescription>
              Employee imports require both 'name' and 'email' columns.
              Email addresses must match existing user accounts.
            </AlertDescription>
          </Alert>
        )}
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
