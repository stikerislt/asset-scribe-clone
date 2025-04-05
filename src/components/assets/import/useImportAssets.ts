
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Asset, VALID_ASSET_STATUSES, AssetStatus } from "@/lib/api/assets";
import { toast as sonnerToast } from "@/hooks/use-sonner-toast";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export const useImportAssets = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);

  const importAssetsMutation = useMutation({
    mutationFn: async (data: Record<string, any>[]) => {
      if (!user) {
        throw new Error("You must be logged in to import assets");
      }

      const assetsToImport = data.map(row => {
        const statusValue = (row.status || "ready").toLowerCase();
        const validStatus = VALID_ASSET_STATUSES.includes(statusValue as AssetStatus) 
          ? statusValue 
          : "ready";

        return {
          name: row.name || "Unnamed Asset",
          tag: row.tag || `ASSET-${Math.floor(Math.random() * 1000)}`,
          category: row.category || "General",
          status: validStatus,
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
          updated_at: new Date().toISOString(),
          user_id: user.id
        };
      });

      console.log("Importing assets with user ID:", user.id);
      console.log("First asset to import:", assetsToImport[0]);

      const { data: result, error } = await supabase
        .from('assets')
        .insert(assetsToImport)
        .select();

      if (error) {
        console.error("Import error:", error);
        throw new Error(`Failed to import assets: ${error.message}`);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      sonnerToast.success("Assets imported successfully", {
        description: "Your assets have been added to your inventory."
      });
    },
    onError: (error) => {
      console.error("Import mutation error:", error);
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const importAssets = async (data: Record<string, any>[]) => {
    try {
      setIsImporting(true);
      await importAssetsMutation.mutateAsync(data);
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsImporting(false);
    }
  };

  return {
    importAssets,
    isImporting
  };
};
