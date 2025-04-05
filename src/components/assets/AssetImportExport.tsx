
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-sonner-toast";
import { Download, Upload } from "lucide-react";
import { CSVPreview } from "@/components/CSVPreview";
import { parseCSV, downloadCSV } from "@/lib/csv-utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Asset } from "@/lib/api/assets";
import { supabase } from "@/integrations/supabase/client";

interface AssetImportExportProps {
  assets: Asset[];
}

export const AssetImportExport = ({ assets }: AssetImportExportProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState<{
    headers: string[];
    data: string[][];
  } | null>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      
      if (fileExtension === "csv") {
        const text = await file.text();
        const { headers, data } = parseCSV(text);
        
        if (headers.length === 0 || data.length === 0) {
          toast.error("Invalid CSV format", {
            description: "Could not parse the CSV file properly."
          });
          return;
        }
        
        setImportData({ headers, data });
        setIsImporting(true);
      } else {
        toast.error("Unsupported file format", {
          description: "Please upload a CSV file."
        });
      }
    } catch (error) {
      console.error("Error reading file:", error);
      toast.error("Error reading file", {
        description: "There was an error processing your file."
      });
    }
    
    // Reset the input so the same file can be selected again
    e.target.value = "";
  };
  
  const handleExport = () => {
    try {
      if (assets.length === 0) {
        toast.error("No assets to export", {
          description: "There are no assets in your inventory to export."
        });
        return;
      }
      
      // Convert assets to CSV format
      const headers = ["Name", "Tag", "Category", "Status", "Location", "Assigned To", 
                      "Model", "Serial", "Purchase Date", "Purchase Cost", "Notes"];
      
      const data = assets.map(asset => [
        asset.name,
        asset.tag,
        asset.category,
        asset.status,
        asset.location || "",
        asset.assigned_to || "",
        asset.model || "",
        asset.serial || "",
        asset.purchase_date || "",
        asset.purchase_cost ? String(asset.purchase_cost) : "",
        asset.notes || ""
      ]);
      
      downloadCSV(headers, data, "asset-inventory");
      toast.success("Export complete", {
        description: `${assets.length} assets exported to CSV`
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed", {
        description: "There was an error exporting your assets."
      });
    }
  };
  
  const handleConfirmImport = async () => {
    if (!importData) return;
    
    try {
      const { headers, data } = importData;
      
      // Map CSV columns to database fields
      const nameIndex = headers.findIndex(h => h.toLowerCase().includes("name"));
      const tagIndex = headers.findIndex(h => h.toLowerCase().includes("tag"));
      const categoryIndex = headers.findIndex(h => h.toLowerCase().includes("category"));
      const statusIndex = headers.findIndex(h => h.toLowerCase().includes("status"));
      const locationIndex = headers.findIndex(h => h.toLowerCase().includes("location"));
      const assignedToIndex = headers.findIndex(h => h.toLowerCase().includes("assigned"));
      const modelIndex = headers.findIndex(h => h.toLowerCase().includes("model"));
      const serialIndex = headers.findIndex(h => h.toLowerCase().includes("serial"));
      const purchaseDateIndex = headers.findIndex(h => h.toLowerCase().includes("date"));
      const purchaseCostIndex = headers.findIndex(h => h.toLowerCase().includes("cost"));
      const notesIndex = headers.findIndex(h => h.toLowerCase().includes("notes"));
      const wearIndex = headers.findIndex(h => h.toLowerCase().includes("wear"));
      const qtyIndex = headers.findIndex(h => h.toLowerCase().includes("qty") || h.toLowerCase().includes("quantity"));
      
      if (nameIndex === -1 || tagIndex === -1 || categoryIndex === -1) {
        toast.error("Invalid CSV format", {
          description: "CSV must contain at least Name, Tag, and Category columns."
        });
        return;
      }
      
      // Transform CSV data to assets
      const assets = data.map(row => {
        const asset: any = {
          name: row[nameIndex],
          tag: row[tagIndex],
          category: row[categoryIndex],
          status: row[statusIndex] || "ready",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        if (locationIndex !== -1) asset.location = row[locationIndex];
        if (assignedToIndex !== -1) asset.assigned_to = row[assignedToIndex];
        if (modelIndex !== -1) asset.model = row[modelIndex];
        if (serialIndex !== -1) asset.serial = row[serialIndex];
        if (purchaseDateIndex !== -1) asset.purchase_date = row[purchaseDateIndex];
        if (purchaseCostIndex !== -1) asset.purchase_cost = parseFloat(row[purchaseCostIndex]) || null;
        if (notesIndex !== -1) asset.notes = row[notesIndex];
        if (wearIndex !== -1) asset.wear = row[wearIndex];
        if (qtyIndex !== -1) asset.qty = parseInt(row[qtyIndex]) || 1;
        
        return asset;
      });
      
      // Insert into database
      const { data: insertedData, error } = await supabase
        .from('assets')
        .insert(assets)
        .select();
      
      if (error) throw error;
      
      toast.success("Import complete", {
        description: `${assets.length} assets imported successfully.`
      });
      
      setIsImporting(false);
      setImportData(null);
      
      // Reload the page to refresh the asset list
      window.location.reload();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Import failed", {
        description: "There was an error importing your assets. Please check the console for details."
      });
    }
  };
  
  const handleCancelImport = () => {
    setIsImporting(false);
    setImportData(null);
  };
  
  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        
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
      </div>
      
      <Dialog open={isImporting} onOpenChange={setIsImporting}>
        <DialogContent className="max-w-4xl">
          {importData && (
            <CSVPreview
              headers={importData.headers}
              data={importData.data}
              onConfirm={handleConfirmImport}
              onCancel={handleCancelImport}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
