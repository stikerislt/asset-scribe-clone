
import { useState, useRef } from "react";
import { Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generateEmployeeImportTemplate } from "@/lib/csv/employee-import-template";
import { parseCSV } from "@/lib/csv/csv-parser";
import { ImportEmployeesDialog } from "./ImportEmployeesDialog";

interface ImportEmployeesButtonProps {
  onImportComplete?: () => void;
}

export const ImportEmployeesButton = ({ onImportComplete }: ImportEmployeesButtonProps) => {
  const { toast } = useToast();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvData, setCsvData] = useState<{ headers: string[], data: string[][] }>({ headers: [], data: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDownloadTemplate = () => {
    const template = generateEmployeeImportTemplate();
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `employee-import-template.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Template downloaded",
      description: "Employee import template has been downloaded.",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = parseCSV(content);
        
        // Check for required columns
        const hasNameColumn = parsed.headers.some(h => h.toLowerCase() === 'name');
        const hasEmailColumn = parsed.headers.some(h => h.toLowerCase() === 'email');
        
        if (!hasNameColumn || !hasEmailColumn) {
          toast({
            title: "Invalid format",
            description: "The CSV file must contain both 'name' and 'email' columns.",
            variant: "destructive",
          });
        }
        
        setCsvData(parsed);
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
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
        
        <Button 
          variant="ghost" 
          onClick={handleDownloadTemplate}
          size="sm"
        >
          Download Template
        </Button>
        
        <input 
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      <ImportEmployeesDialog
        isOpen={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        headers={csvData.headers}
        data={csvData.data}
        onImportComplete={() => {
          onImportComplete?.();
          setIsImportDialogOpen(false);
        }}
      />
    </>
  );
};
