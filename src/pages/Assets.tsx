import { useState, useEffect } from "react";
import { Package, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "@/hooks/use-sonner-toast";
import { useAuth } from "@/hooks/useAuth";
import { useActivity } from "@/hooks/useActivity";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, checkAuth } from "@/integrations/supabase/client";
import { Asset, AssetStatus } from "@/lib/api/assets";
import { StatusColor } from "@/lib/data";

// Import our new components
import { AssetFilters, Filters } from "@/components/assets/AssetFilters";
import { AssetTable } from "@/components/assets/AssetTable";
import { AssetImportExport } from "@/components/assets/AssetImportExport";
import { AssetActionButtons } from "@/components/assets/AssetActionButtons";
import { DebugInfo, ErrorState } from "@/components/assets/DebugInfo";
import { ColumnDef, ColumnVisibilityDropdown } from "@/components/assets/ColumnVisibilityDropdown";
import { debugAssetAccess, getFilterOptions, filterAssets } from "@/lib/helpers/assetUtils";

const Assets = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState("");
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Filters>({
    tag: [],
    name: [],
    assignedTo: [],
    purchaseDate: [],
    wear: [],
    purchaseCost: [],
    category: []
  });

  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: "tag", label: "Asset Tag", isVisible: true },
    { id: "name", label: "Name", isVisible: true },
    { id: "category", label: "Category", isVisible: true },
    { id: "assignedTo", label: "Assigned To", isVisible: true },
    { id: "purchaseDate", label: "Purchase Date", isVisible: true },
    { id: "wear", label: "Wear", isVisible: true },
    { id: "purchaseCost", label: "Purchase Cost", isVisible: true },
    { id: "quantity", label: "Qty", isVisible: true }
  ]);

  const handleColumnVisibilityChange = (columnId: string, isVisible: boolean) => {
    setColumns(prev => 
      prev.map(col => 
        col.id === columnId ? { ...col, isVisible } : col
      )
    );
  };

  const resetColumnVisibility = () => {
    setColumns(prev => prev.map(col => ({ ...col, isVisible: true })));
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { logActivity } = useActivity();
  
  useEffect(() => {
    const checkAuthStatus = async () => {
      const session = await checkAuth();
      console.log("Auth status check on Assets page:", !!session);
    };
    
    checkAuthStatus();
  }, []);
  
  const { data: assets = [], isLoading, error } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      console.log("Fetching assets");
      console.log("Current user:", user);
      
      const { data, error } = await supabase
        .from('assets')
        .select('*');
      
      console.log("Assets fetch result:", { data, error });
      
      if (error) {
        sonnerToast.error("Failed to load assets", {
          description: error.message
        });
        throw new Error(error.message);
      }
      
      const assetsWithProps = data?.map(asset => ({
        ...asset,
        notes: asset.notes || null,
        wear: asset.wear || null,
        qty: asset.qty || 1,
        status_color: asset.status_color as StatusColor || null,
        status: asset.status as AssetStatus
      })) as Asset[];
      
      console.log("Processed assets:", assetsWithProps?.length);
      return assetsWithProps;
    },
    retry: 1,
    refetchOnWindowFocus: false
  });
  
  const filterOptions = {
    tag: getFilterOptions(assets, 'tag' as keyof Asset),
    name: getFilterOptions(assets, 'name' as keyof Asset),
    assignedTo: getFilterOptions(assets, 'assigned_to' as keyof Asset),
    purchaseDate: getFilterOptions(assets, 'purchase_date' as keyof Asset)
      .map(date => new Date(date).toLocaleDateString()),
    wear: getFilterOptions(assets, 'wear' as keyof Asset),
    purchaseCost: getFilterOptions(assets, 'purchase_cost' as keyof Asset)
      .map(cost => `$${Number(cost).toFixed(2)}`),
    category: getFilterOptions(assets, 'category' as keyof Asset)
  };
  
  const createAssetMutation = useMutation({
    mutationFn: async (newAsset: Omit<Asset, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('assets')
        .insert([{
          ...newAsset,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: user?.id || null
        }])
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });
  
  const deleteAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return assetId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });
  
  const deleteAllAssetsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });

  const updateAssetStatusColorMutation = useMutation({
    mutationFn: async ({ id, statusColor }: { id: string, statusColor: StatusColor }) => {
      const { data, error } = await supabase
        .from('assets')
        .update({ status_color: statusColor })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    }
  });

  const handleStatusColorChange = async (assetId: string, newColor: StatusColor) => {
    try {
      await updateAssetStatusColorMutation.mutateAsync({ 
        id: assetId, 
        statusColor: newColor 
      });
      
      toast({
        title: "Status updated",
        description: `Asset status color has been updated to ${newColor}`,
      });
      
      logActivity({
        title: "Asset Status Updated",
        description: `Status color changed to ${newColor}`,
        category: 'asset',
        icon: <Package className="h-5 w-5 text-blue-600" />
      });
    } catch (error) {
      console.error('Error updating status color:', error);
      toast({
        title: "Error",
        description: "Failed to update status color",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAsset = (asset: Asset) => {
    setAssetToDelete(asset);
    setIsDeleteConfirmOpen(true);
  };
  
  const confirmDeleteAsset = async () => {
    if (!assetToDelete) return;
    
    try {
      await deleteAssetMutation.mutateAsync(assetToDelete.id);
      
      toast({
        title: "Asset Deleted",
        description: `${assetToDelete.name} has been removed from inventory`,
      });
      
      logActivity({
        title: "Asset Deleted",
        description: `${assetToDelete.name} removed from inventory`,
        category: 'asset',
        icon: <Package className="h-5 w-5 text-red-600" />
      });
      
      setIsDeleteConfirmOpen(false);
      setAssetToDelete(null);
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast({
        title: "Error",
        description: "Failed to delete asset. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteAllAssets = async () => {
    if (!assets || assets.length === 0) {
      toast({
        title: "No Assets to Delete",
        description: "There are no assets in the inventory to delete.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await deleteAllAssetsMutation.mutateAsync();
      
      toast({
        title: "All Assets Deleted",
        description: `${assets.length} assets have been removed from inventory`,
      });
      
      logActivity({
        title: "All Assets Deleted",
        description: `${assets.length} assets removed from inventory`,
        category: 'asset',
        icon: <AlertTriangle className="h-5 w-5 text-red-600" />
      });
    } catch (error) {
      console.error('Error deleting all assets:', error);
      toast({
        title: "Error",
        description: "Failed to delete all assets. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleAddAsset = async (assetData: Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      await createAssetMutation.mutateAsync({
        ...assetData,
        status_color: assetData.status_color || null,
        location: assetData.location || null,
        purchase_cost: assetData.purchase_cost || null,
        user_id: null
      });
      
      toast({
        title: "Asset Created",
        description: `${assetData.name} has been added to the inventory`,
      });
      
      logActivity({
        title: "Asset Created",
        description: `${assetData.name} added to inventory`,
        category: 'asset',
        icon: <Package className="h-5 w-5 text-blue-600" />
      });
    } catch (error) {
      console.error('Error creating asset:', error);
      toast({
        title: "Error",
        description: "Failed to create asset. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  const handleDebug = async () => {
    setIsDebugging(true);
    try {
      const result = await debugAssetAccess();
      setDebugInfo(result);
      
      if (result.isAuthenticated) {
        toast({
          title: "Authentication Status",
          description: "You are authenticated. See console for details."
        });
      } else {
        toast({
          title: "Authentication Status",
          description: "You are not authenticated. Please log in.",
          variant: "destructive"
        });
      }
    } catch (e) {
      console.error("Debug error:", e);
    } finally {
      setIsDebugging(false);
    }
  };
  
  const filteredAssets = filterAssets(assets, searchTerm, activeFilters);

  if (error) {
    return (
      <ErrorState 
        error={error as Error} 
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['assets'] })} 
        onDebug={handleDebug}
      />
    );
  }
  
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Assets</h1>
          <p className="text-muted-foreground mt-1">Manage your hardware and device inventory</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0 flex-wrap">
          <AssetImportExport assets={assets} />
          <AssetActionButtons 
            onDebug={handleDebug}
            isDebugging={isDebugging}
            onAddAsset={handleAddAsset}
            onDeleteAllAssets={handleDeleteAllAssets}
          />
        </div>
      </div>
      
      <DebugInfo debugInfo={debugInfo} />
      
      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading assets...</p>
        </div>
      ) : assets.length === 0 ? (
        <Alert>
          <AlertTitle>No Assets Found</AlertTitle>
          <p>
            You don't have any assets in your inventory yet.
            Click "Add Asset" to create your first asset, or import assets from a CSV file.
          </p>
        </Alert>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <AssetFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              activeFilters={activeFilters}
              setActiveFilters={setActiveFilters}
              filterOptions={filterOptions}
              isFiltersOpen={isFiltersOpen}
              setIsFiltersOpen={setIsFiltersOpen}
            />
            
            <ColumnVisibilityDropdown
              columns={columns}
              onColumnVisibilityChange={handleColumnVisibilityChange}
              onResetColumns={resetColumnVisibility}
            />
          </div>
          
          <AssetTable 
            assets={filteredAssets}
            columns={columns} 
            onDeleteAsset={handleDeleteAsset} 
            onStatusColorChange={handleStatusColorChange}
          />
        </div>
      )}
    </div>
  );
};

export default Assets;
