
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { CSVPreview } from "@/components/CSVPreview";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Asset, AssetStatus } from "@/lib/api/assets";
import { useActivity } from "@/hooks/useActivity";
import { Package } from "lucide-react";

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
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logActivity } = useActivity();

  const handleImportConfirm = async () => {
    if (previewData.data.length === 0) {
      toast({
        title: "No data to import",
        description: "The file doesn't contain any valid data rows.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      // Map headers to lowercase for consistent key access
      const headers = previewData.headers.map(h => h.toLowerCase());
      
      // Transform CSV data to assets
      const assets = previewData.data.map(row => {
        const asset: Record<string, any> = {};
        
        headers.forEach((header, index) => {
          if (header && row[index] !== undefined) {
            // Clean up the field name
            const cleanHeader = header.trim();
            
            // Skip empty cells or the trailing \r column if present
            if (cleanHeader && row[index] !== '') {
              // Handle special case of status (always lowercase)
              if (cleanHeader === 'status') {
                asset[cleanHeader] = row[index].toLowerCase();
              }
              // Handle special case of status_color (always lowercase)
              else if (cleanHeader === 'status_color') {
                asset[cleanHeader] = row[index].toLowerCase();
              }
              // Handle numeric fields
              else if (cleanHeader === 'qty') {
                asset[cleanHeader] = parseInt(row[index], 10) || 1;
              }
              else if (cleanHeader === 'purchase_cost') {
                asset[cleanHeader] = parseFloat(row[index]) || null;
              }
              else if (cleanHeader === 'wear') {
                asset[cleanHeader] = parseInt(row[index], 10) || null;
              }
              // All other fields
              else {
                asset[cleanHeader] = row[index];
              }
            }
          }
        });

        // Set default values for required fields if missing
        if (!asset.status) asset.status = 'ready';
        if (!asset.qty) asset.qty = 1;
        
        // Add created_at and updated_at
        asset.created_at = new Date().toISOString();
        asset.updated_at = new Date().toISOString();

        return asset;
      });
      
      // Insert assets into the database
      const { data, error } = await supabase
        .from('assets')
        .insert(assets);
      
      if (error) {
        throw error;
      }
      
      // Log activity and notify user
      logActivity({
        title: "Assets Imported",
        description: `${assets.length} assets imported successfully`,
        category: 'asset',
        icon: <Package className="h-5 w-5 text-blue-600" />
      });

      toast({
        title: "Import successful",
        description: `${assets.length} assets have been imported.`,
      });
      
      // Refresh the assets list
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An error occurred during import.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogTitle>Import Assets</DialogTitle>
        <DialogDescription>
          Review the data below before importing. All required fields must be filled.
        </DialogDescription>
        <CSVPreview
          headers={previewData.headers}
          data={previewData.data}
          fileType={previewData.fileType}
          onCancel={onClose}
          onConfirm={handleImportConfirm}
          loading={isImporting}
        />
      </DialogContent>
    </Dialog>
  );
};
