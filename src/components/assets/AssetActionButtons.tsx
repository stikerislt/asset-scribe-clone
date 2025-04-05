
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, RefreshCw, Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AssetForm } from "@/components/AssetForm";
import { Asset } from "@/lib/api/assets";
import { useActivity } from "@/hooks/useActivity";

interface AssetActionButtonsProps {
  onDebug: () => void;
  isDebugging: boolean;
  onAddAsset: (assetData: any) => Promise<void>;
  onDeleteAllAssets: () => void;
}

export const AssetActionButtons = ({
  onDebug,
  isDebugging,
  onAddAsset,
  onDeleteAllAssets
}: AssetActionButtonsProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState("");
  
  const { toast } = useToast();
  const { logActivity } = useActivity();
  
  const handleAddAssetSubmit = async (assetData: any) => {
    try {
      await onAddAsset(assetData);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error in handleAddAssetSubmit:", error);
    }
  };
  
  const confirmDeleteAllAssets = async () => {
    if (deleteAllConfirmText !== "DELETE ALL ASSETS") {
      toast({
        title: "Confirmation Failed",
        description: "Please type the exact confirmation phrase to proceed.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      onDeleteAllAssets();
      setIsDeleteAllDialogOpen(false);
      setDeleteAllConfirmText("");
    } catch (error) {
      console.error('Error in confirmDeleteAllAssets:', error);
    }
  };
  
  return (
    <>
      <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Asset
      </Button>
      <Button size="sm" variant="outline" onClick={onDebug} disabled={isDebugging}>
        <RefreshCw className={`mr-2 h-4 w-4 ${isDebugging ? 'animate-spin' : ''}`} />
        Debug
      </Button>
      <Button size="sm" variant="destructive" onClick={() => setIsDeleteAllDialogOpen(true)}>
        <Trash className="mr-2 h-4 w-4" />
        Delete All
      </Button>
      
      {/* Add Asset Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
          </DialogHeader>
          <AssetForm 
            onSubmit={handleAddAssetSubmit} 
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete All Alert Dialog */}
      <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete ALL assets from your inventory.
              <br />
              This action cannot be undone.
              <br /><br />
              Type <code className="bg-muted p-1 rounded">DELETE ALL ASSETS</code> to confirm.
            </AlertDialogDescription>
            <div className="mt-2">
              <Input
                value={deleteAllConfirmText}
                onChange={(e) => setDeleteAllConfirmText(e.target.value)}
                placeholder="Type DELETE ALL ASSETS to confirm"
                className="mt-2"
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteAllAssets();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete All Assets
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
