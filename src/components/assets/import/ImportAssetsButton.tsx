
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseFileForPreview } from "@/lib/preview-csv";
import { ImportAssetsDialog } from "./ImportAssetsDialog";

export const ImportAssetsButton = () => {
  const { toast } = useToast();
  const [previewData, setPreviewData] = useState<{ 
    headers: string[], 
    data: string[][], 
    fileType: 'csv' | 'excel' 
  } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV or Excel file to import.",
        variant: "destructive",
      });
      return;
    }

    parseFileForPreview(file)
      .then(({ headers, data, fileType }) => {
        console.log(`Parsed ${fileType} file:`, { headers, rows: data.length });
        
        if (headers.length === 0 || data.length === 0) {
          toast({
            title: "Invalid file format",
            description: "The file appears to be empty or improperly formatted.",
            variant: "destructive",
          });
          return;
        }
        
        setPreviewData({ headers, data, fileType });
        setIsPreviewOpen(true);
      })
      .catch(error => {
        console.error("Error parsing file:", error);
        toast({
          title: "File parsing error",
          description: "There was an error parsing the file. Please check the format.",
          variant: "destructive",
        });
      });
    
    event.target.value = '';
  };

  const handleDialogClose = () => {
    setIsPreviewOpen(false);
    setPreviewData(null);
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
        <Upload className="mr-2 h-4 w-4" />
        Import
      </Button>
      <input
        id="file-upload"
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />

      {previewData && (
        <ImportAssetsDialog
          isOpen={isPreviewOpen}
          onClose={handleDialogClose}
          previewData={previewData}
        />
      )}
    </>
  );
};
