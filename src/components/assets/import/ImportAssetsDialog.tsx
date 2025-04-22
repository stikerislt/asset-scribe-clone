
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
            const cleanHeader = header.trim();
            if (cleanHeader && row[index] !== '') {
              if (cleanHeader === 'status') {
                const statusValue = row[index].toLowerCase();
                if (VALID_ASSET_STATUSES.includes(statusValue as AssetStatus)) {
                  asset[cleanHeader] = statusValue as AssetStatus;
                } else {
                  asset[cleanHeader] = 'ready' as AssetStatus;
                }
              }
              else if (cleanHeader === 'status_color') {
                asset[cleanHeader] = row[index].toLowerCase();
              }
              else if (cleanHeader === 'qty') {
                asset[cleanHeader] = parseInt(row[index], 10) || 1;
              }
              else if (cleanHeader === 'purchase_cost') {
                asset[cleanHeader] = parseFloat(row[index]) || null;
              }
              else if (cleanHeader === 'wear') {
                asset[cleanHeader] = parseInt(row[index], 10) || null;
              }
              else {
                asset[cleanHeader] = row[index];
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
