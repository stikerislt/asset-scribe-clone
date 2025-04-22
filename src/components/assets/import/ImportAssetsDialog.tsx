
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { CSVPreview } from "@/components/CSVPreview";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Asset, AssetStatus, VALID_ASSET_STATUSES } from "@/lib/api/assets";
import { Package } from "lucide-react";
import { useActivity } from "@/hooks/useActivity";
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

  // Helper function to normalize column names (preserve underscores, lowercase)
  const normalizeColumnName = (header: string): string => {
    return header.toLowerCase().trim();
  };

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
      // Normalize headers (lowercase and preserve underscores)
      const headers = previewData.headers.map(h => normalizeColumnName(h));
      console.log("Normalized headers:", headers);

      // Transform CSV data to assets
      const assets = previewData.data.map(row => {
        // Create a properly typed asset object with required fields
        const asset: {
          name: string;
          tag: string;
          category: string;
          status: AssetStatus;
          user_id: string;
          [key: string]: any;
        } = {
          name: '',
          tag: '',
          category: '',
          status: 'ready' as AssetStatus,
          user_id: user.id,
        };

        headers.forEach((header, index) => {
          if (header && row[index] !== undefined) {
            // Skip empty cells or headers
            if (header && row[index] !== '') {
              if (header === 'status') {
                const statusValue = row[index].toLowerCase();
                if (VALID_ASSET_STATUSES.includes(statusValue as AssetStatus)) {
                  asset[header] = statusValue as AssetStatus;
                } else {
                  asset[header] = 'ready' as AssetStatus;
                }
              }
              else if (header === 'status_color') {
                asset[header] = row[index].toLowerCase();
              }
              else if (header === 'qty') {
                asset[header] = parseInt(row[index], 10) || 1;
              }
              else if (header === 'purchase_cost') {
                asset[header] = parseFloat(row[index]) || null;
              }
              else if (header === 'wear') {
                asset[header] = parseInt(row[index], 10) || null;
              }
              else {
                asset[header] = row[index];
              }
            }
          }
        });

        if (!asset.name) asset.name = `Imported Asset ${row[0] || ''}`;
        if (!asset.tag) asset.tag = `IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        if (!asset.category) asset.category = 'General';
        if (!VALID_ASSET_STATUSES.includes(asset.status)) {
          asset.status = 'ready' as AssetStatus;
        }

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
        // Log extra error info if present
        console.error("Supabase insert error:", error);
        let backendErrorInfo = error.message;
        
        // More detailed error message for column not found errors
        if (error.message.includes("column") && error.message.includes("schema cache")) {
          const match = error.message.match(/Could not find the '(.+?)' column/);
          if (match && match[1]) {
            const problematicColumn = match[1];
            const suggestedColumn = problematicColumn.replace(/ /g, "_");
            backendErrorInfo = `Column name error: "${problematicColumn}" doesn't exist in the database. Did you mean "${suggestedColumn}"? Make sure your CSV headers match database column names exactly (e.g., "assigned_to" not "assigned to").`;
          }
        }
        
        if (error.code) backendErrorInfo += ` (code: ${error.code})`;
        if (error.details) backendErrorInfo += ` Details: ${error.details}`;
        if (error.hint) backendErrorInfo += ` Hint: ${error.hint}`;
        throw new Error(backendErrorInfo);
      }

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

      queryClient.invalidateQueries({ queryKey: ['assets'] });

      onClose();
    } catch (error: any) {
      console.error("Import error:", error);
      let errorMessage = "An unknown error occurred during import.";
      // Attach more info if available
      if (error instanceof Error) {
        errorMessage = error.message;
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
