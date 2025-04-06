
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseCSV } from "@/lib/csv/csv-parser";
import { generateAssetImportTemplate } from "@/lib/csv/csv-import";
import { ImportAssetsDialog } from "./ImportAssetsDialog";

interface ImportAssetsButtonProps {
  onImportComplete?: () => void;
}

export const ImportAssetsButton = ({ onImportComplete }: ImportAssetsButtonProps) => {
  const { toast } = useToast();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvData, setCsvData] = useState<{ headers: string[], data: string[][] }>({ headers: [], data: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDownloadTemplate = () => {
    const template = generateAssetImportTemplate();
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `asset-import-template.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Template downloaded",
      description: "Asset import template has been downloaded.",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        // Clean up any trailing \r characters from headers
        const parsed = parseCSV(content);
        const cleanedHeaders = parsed.headers.map(header => 
          header.endsWith('\r') ? header.slice(0, -1) : header
        );
        setCsvData({ headers: cleanedHeaders, data: parsed.data });
        setIsImportDialogOpen(true);
      } catch (error) {
        toast({
          title: "Error parsing CSV",
          description: "The selected file could not be parsed. Please ensure it's a valid CSV file.",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
    
    // Reset the file input
    if (e.target) {
      e.target.value = "";
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleDownloadTemplate}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Template
        </Button>
        
        <input 
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      <ImportAssetsDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        previewData={{
          headers: csvData.headers,
          data: csvData.data,
          fileType: 'csv'
        }}
      />
    </>
  );
};
