
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { CSVPreview } from "@/components/CSVPreview";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Asset, AssetStatus, VALID_ASSET_STATUSES } from "@/lib/api/assets";
import { useActivity } from "@/hooks/useActivity";
import { Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();

  const handleImportConfirm = async () => {
    if (previewData.data.length === 0) {
      toast({
        title: "No data to import",
        description: "The file doesn't contain any valid data rows.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to import assets.",
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
        // Create a properly typed asset object with required fields
        const asset: {
          name: string;
          tag: string;
          category: string;
          status: AssetStatus;
          user_id: string; // Add user_id field
          [key: string]: any;
        } = {
          name: '',           // Required field, default empty
          tag: '',            // Required field, default empty
          category: '',       // Required field, default empty
          status: 'ready' as AssetStatus,    // Required field, default 'ready'
          user_id: user.id,   // Set the user_id to current user's ID
        };
        
        headers.forEach((header, index) => {
          if (header && row[index] !== undefined) {
            // Clean up the field name
            const cleanHeader = header.trim();
            
            // Skip empty cells
            if (cleanHeader && row[index] !== '') {
              // Handle special case of status (always lowercase)
              if (cleanHeader === 'status') {
                // Ensure the status value is a valid AssetStatus
                const statusValue = row[index].toLowerCase();
                // Type guard: check if the status is valid
                if (VALID_ASSET_STATUSES.includes(statusValue as AssetStatus)) {
                  asset[cleanHeader] = statusValue as AssetStatus;
                } else {
                  // Default to 'ready' if invalid status
                  asset[cleanHeader] = 'ready' as AssetStatus;
                }
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

        // Set default values for required fields if they're empty
        if (!asset.name) asset.name = `Imported Asset ${row[0] || ''}`;
        if (!asset.tag) asset.tag = `IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        if (!asset.category) asset.category = 'General';
        if (!VALID_ASSET_STATUSES.includes(asset.status)) {
          asset.status = 'ready' as AssetStatus;
        }
        
        // Add created_at and updated_at
        asset.created_at = new Date().toISOString();
        asset.updated_at = new Date().toISOString();

        return asset;
      });
      
      console.log("Importing assets:", assets);
      
      // Insert assets into the database
      const { data, error } = await supabase
        .from('assets')
        .insert(assets);
      
      if (error) {
        console.error("Supabase insert error:", error);
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
      
      let errorMessage = "An unknown error occurred during import.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific Supabase errors
        if (errorMessage.includes("violates row-level security policy")) {
          errorMessage = "Failed to import due to security restrictions. Make sure you're properly authenticated.";
        } else if (errorMessage.includes("duplicate key")) {
          errorMessage = "Some assets couldn't be imported due to duplicate tags or IDs.";
        }
      }
      
      toast({
        title: "Import failed",
        description: errorMessage,
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
