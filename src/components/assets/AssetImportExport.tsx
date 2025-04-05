
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Asset } from "@/lib/api/assets";
import { CSVLink } from "react-csv";
import { parseCSV } from "@/lib/csv-utils";
import { CSVPreview } from "@/components/CSVPreview";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "@/hooks/use-sonner-toast";

interface AssetImportExportProps {
  assets: Asset[];
}

export const AssetImportExport = ({ assets }: AssetImportExportProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewData, setPreviewData] = useState<{ headers: string[], data: string[][] } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const importAssetsMutation = useMutation({
    mutationFn: async (data: Record<string, any>[]) => {
      // Transform data to match the Asset structure
      const assetsToImport = data.map(row => {
        return {
          name: row.name || "Unnamed Asset",
          tag: row.tag || `ASSET-${Math.floor(Math.random() * 1000)}`,
          category: row.category || "General",
          status: row.status || "ready",
          status_color: row.status_color || null,
          assigned_to: row.assigned_to || null,
          model: row.model || null,
          serial: row.serial || null,
          purchase_date: row.purchase_date || null,
          purchase_cost: row.purchase_cost ? Number(row.purchase_cost) : null,
          location: row.location || null,
          notes: row.notes || null,
          wear: row.wear || null,
          qty: row.qty ? Number(row.qty) : 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      const { data: result, error } = await supabase
        .from('assets')
        .insert(assetsToImport)
        .select();

      if (error) {
        throw new Error(`Failed to import assets: ${error.message}`);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      sonnerToast.success("Assets imported successfully", {
        description: "Your assets have been added to your inventory."
      });
      setIsPreviewOpen(false);
      setPreviewData(null);
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const { headers, data } = parseCSV(csvText);
        
        // Validate the CSV structure
        if (headers.length === 0 || data.length === 0) {
          toast({
            title: "Invalid CSV format",
            description: "The CSV file appears to be empty or improperly formatted.",
            variant: "destructive",
          });
          return;
        }
        
        setPreviewData({ headers, data });
        setIsPreviewOpen(true);
      } catch (error) {
        console.error("Error parsing CSV:", error);
        toast({
          title: "CSV parsing error",
          description: "There was an error parsing the CSV file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  const handleImportConfirm = () => {
    if (!previewData) return;
    
    try {
      // Convert the 2D array data to array of objects using headers as keys
      const objectData = previewData.data.map(row => {
        const obj: Record<string, any> = {};
        previewData.headers.forEach((header, index) => {
          obj[header.toLowerCase().replace(/\s+/g, '_')] = row[index];
        });
        return obj;
      });
      
      importAssetsMutation.mutateAsync(objectData);
    } catch (error) {
      console.error("Error during import confirmation:", error);
      toast({
        title: "Import error",
        description: "An unexpected error occurred during import.",
        variant: "destructive",
      });
    }
  };

  const csvHeaders = [
    { label: "Name", key: "name" },
    { label: "Tag", key: "tag" },
    { label: "Category", key: "category" },
    { label: "Status", key: "status" },
    { label: "Status Color", key: "status_color" },
    { label: "Assigned To", key: "assigned_to" },
    { label: "Model", key: "model" },
    { label: "Serial", key: "serial" },
    { label: "Purchase Date", key: "purchase_date" },
    { label: "Purchase Cost", key: "purchase_cost" },
    { label: "Location", key: "location" },
    { label: "Notes", key: "notes" },
    { label: "Wear", key: "wear" },
    { label: "Qty", key: "qty" },
  ];

  return (
    <div className="flex gap-2">
      <div>
        <Button size="sm" variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
        <input
          id="file-upload"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <CSVLink
        data={assets}
        headers={csvHeaders}
        filename={"assets.csv"}
      >
        <Button size="sm" variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </CSVLink>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl">
          {previewData && (
            <CSVPreview
              headers={previewData.headers}
              data={previewData.data}
              onConfirm={handleImportConfirm}
              onCancel={() => setIsPreviewOpen(false)}
              fileType="csv"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
