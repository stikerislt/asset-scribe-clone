import { useState, useRef, useEffect } from "react";
import { AssetStatusBadge } from "@/components/AssetStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Package, 
  Plus, 
  MoreHorizontal, 
  Search, 
  Edit, 
  Trash, 
  Download, 
  UserPlus,
  Filter,
  Import,
  Loader,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  ArrowUpDown,
  Check,
  X
} from "lucide-react";
import { 
  Popover,
  PopoverTrigger,
  PopoverContent 
} from "@/components/ui/popover";
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
import {
  Alert,
  AlertTitle,
  AlertDescription
} from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { 
  Asset, 
  AssetStatus, 
  VALID_ASSET_STATUSES 
} from "@/lib/api/assets";
import { csvToObjects, objectsToCSV, generateAssetImportTemplate } from "@/lib/csv-utils";
import { parseCSVForPreview } from "@/lib/preview-csv";
import { useActivity } from "@/hooks/useActivity";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AssetForm } from "@/components/AssetForm";
import { CSVPreview } from "@/components/CSVPreview";
import { supabase, checkAuth, debugRlsAccess } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef, ColumnVisibilityDropdown } from "@/components/assets/ColumnVisibilityDropdown";
import { StatusColorIndicator } from "@/components/StatusColorIndicator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StatusColor } from "@/lib/data";

type Filters = {
  tag: string[];
  name: string[];
  assignedTo: string[];
  purchaseDate: string[];
  wear: string[];
  purchaseCost: string[];
}

const Assets = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [csvPreviewData, setCsvPreviewData] = useState<{ headers: string[], data: string[][] } | null>(null);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [showCSVPreview, setShowCSVPreview] = useState(false);
  const [importFileType, setImportFileType] = useState<'csv' | 'excel'>('csv');
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
    purchaseCost: []
  });

  const [columns, setColumns] = useState<ColumnDef[]>([
    { id: "tag", label: "Asset Tag", isVisible: true },
    { id: "name", label: "Name", isVisible: true },
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { logActivity } = useActivity();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
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
      
      const assetsWithNotes = data?.map(asset => ({
        ...asset,
        notes: asset.location
      })) || [];
      
      console.log("Processed assets:", assetsWithNotes.length);
      return assetsWithNotes;
    },
    retry: 1,
    refetchOnWindowFocus: false
  });
  
  const getFilterOptions = (key: keyof Asset) => {
    if (!assets?.length) return [];
    
    const uniqueValues = Array.from(new Set(
      assets
        .map(asset => asset[key])
        .filter(Boolean)
    )).sort();
    
    return uniqueValues.map(value => String(value));
  };
  
  const filterOptions = {
    tag: getFilterOptions('tag' as keyof Asset),
    name: getFilterOptions('name' as keyof Asset),
    assignedTo: getFilterOptions('assigned_to' as keyof Asset),
    purchaseDate: getFilterOptions('purchase_date' as keyof Asset)
      .map(date => new Date(date).toLocaleDateString()),
    wear: getFilterOptions('notes' as keyof Asset),
    purchaseCost: getFilterOptions('purchase_cost' as keyof Asset)
      .map(cost => `$${Number(cost).toFixed(2)}`)
  };
  
  const isFilterActive = (key: keyof Filters) => {
    return activeFilters[key] && activeFilters[key].length > 0;
  };
  
  const activeFilterCount = Object.values(activeFilters).reduce(
    (count, filters) => count + filters.length, 0
  );
  
  const toggleFilter = (key: keyof Filters, value: string) => {
    setActiveFilters(prev => {
      const currentFilters = [...prev[key]];
      const valueIndex = currentFilters.indexOf(value);
      
      if (valueIndex === -1) {
        return { ...prev, [key]: [...currentFilters, value] };
      } else {
        currentFilters.splice(valueIndex, 1);
        return { ...prev, [key]: currentFilters };
      }
    });
  };
  
  const clearFilters = (key: keyof Filters) => {
    setActiveFilters(prev => ({ ...prev, [key]: [] }));
  };
  
  const clearAllFilters = () => {
    setActiveFilters({
      tag: [],
      name: [],
      assignedTo: [],
      purchaseDate: [],
      wear: [],
      purchaseCost: []
    });
  };
  
  const handleDebug = async () => {
    setIsDebugging(true);
    try {
      const result = await debugAssetAccess();
      setDebugInfo(result);
      
      if (result.authenticated) {
        sonnerToast.info("Authentication Status", {
          description: "You are authenticated. See console for details."
        });
      } else {
        sonnerToast.warning("Authentication Status", {
          description: "You are not authenticated. Please log in."
        });
      }
    } catch (e) {
      console.error("Debug error:", e);
    } finally {
      setIsDebugging(false);
    }
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
  
  const handleDeleteAllAssets = () => {
    if (!assets || assets.length === 0) {
      toast({
        title: "No Assets to Delete",
        description: "There are no assets in the inventory to delete.",
        variant: "destructive",
      });
      return;
    }
    
    setIsDeleteAllDialogOpen(true);
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
      
      setIsDeleteAllDialogOpen(false);
      setDeleteAllConfirmText("");
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
      
      setIsAddDialogOpen(false);
      
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
    }
  };
  
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      (asset?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       asset?.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       asset?.category?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    const tagMatch = activeFilters.tag.length === 0 || 
      (asset.tag && activeFilters.tag.includes(asset.tag));
    
    const nameMatch = activeFilters.name.length === 0 || 
      (asset.name && activeFilters.name.includes(asset.name));
    
    const assignedToMatch = activeFilters.assignedTo.length === 0 || 
      (asset.assigned_to && activeFilters.assignedTo.includes(asset.assigned_to));
    
    const purchaseDateMatch = activeFilters.purchaseDate.length === 0 || 
      (asset.purchase_date && 
       activeFilters.purchaseDate.includes(new Date(asset.purchase_date).toLocaleDateString()));
    
    const wearMatch = activeFilters.wear.length === 0 || 
      (asset.notes && activeFilters.wear.includes(asset.notes));
    
    const costMatch = activeFilters.purchaseCost.length === 0 || 
      (asset.purchase_cost && 
       activeFilters.purchaseCost.includes(`$${asset.purchase_cost.toFixed(2)}`));
    
    return tagMatch && nameMatch && assignedToMatch && purchaseDateMatch && wearMatch && costMatch;
  });

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isExcel = fileExtension === 'xlsx' || fileExtension === 'xls';
    setImportFileType(isExcel ? 'excel' : 'csv');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Content = e.target?.result as string;
        setCsvContent(base64Content);
        
        try {
          const previewData = parseCSVForPreview(base64Content, 'excel');
          if (previewData.headers.length === 0 || previewData.data.length === 0) {
            toast({
              title: "Invalid Excel File",
              description: "Unable to parse Excel data. Please check your file format.",
              variant: "destructive",
            });
            return;
          }
          
          const sanitizedData = {
            headers: previewData.headers.map(h => String(h)),
            data: previewData.data.map(row => row.map(cell => String(cell)))
          };
          
          setCsvPreviewData(sanitizedData);
          setShowCSVPreview(true);
        } catch (error) {
          console.error("Excel preview error:", error);
          toast({
            title: "Preview Failed",
            description: "Failed to preview Excel data. Please check your file format.",
            variant: "destructive",
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvContent = e.target?.result as string;
        setCsvContent(csvContent);
        
        try {
          const previewData = parseCSVForPreview(csvContent, 'csv');
          if (previewData.headers.length === 0 || previewData.data.length === 0) {
            toast({
              title: "Invalid CSV",
              description: "Unable to parse CSV data. Please check your file format.",
              variant: "destructive",
            });
            return;
          }
          
          const sanitizedData = {
            headers: previewData.headers.map(h => String(h)),
            data: previewData.data.map(row => row.map(cell => String(cell)))
          };
          
          setCsvPreviewData(sanitizedData);
          setShowCSVPreview(true);
        } catch (error) {
          console.error("CSV preview error:", error);
          toast({
            title: "Preview Failed",
            description: "Failed to preview CSV data. Please check your file format.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }

    event.target.value = '';
  };
  
  const handleConfirmImport = async () => {
    if (!csvContent) {
      toast({
        title: "Import Failed",
        description: "No data content to import",
        variant: "destructive",
      });
      return;
    }
    
    try {
      let importedAssets;
      
      if (importFileType === 'excel') {
        if (!csvPreviewData) return;
        
        importedAssets = csvPreviewData.data.map(row => {
          const asset: Record<string, any> = {};
          csvPreviewData.headers.forEach((header, index) => {
            asset[header] = row[index] || '';
          });
          return asset;
        });
      } else {
        importedAssets = csvToObjects<{
          name: string;
          tag: string;
          serial: string;
          model: string;
          category: string;
          status: string;
          assigned_to: string;
          location: string;
          purchase_date: string;
          purchase_cost: string;
        }>(csvContent);
      }
      
      const validAssets = importedAssets
        .filter(asset => asset.name && asset.tag);
      
      if (validAssets.length === 0) {
        toast({
          title: "Import Failed",
          description: "No valid assets found in the file",
          variant: "destructive",
        });
        return;
      }

      if (!user?.id) {
        toast({
          title: "Import Failed",
          description: "You must be logged in to import assets",
          variant: "destructive",
        });
        return;
      }

      const importErrors = [];
      const importSuccess = [];

      const DEFAULT_CATEGORY = "General";
      

      for (const asset of validAssets) {
    try {
      const category = asset.category || DEFAULT_CATEGORY;
      
      let status = (asset.status || 'ready').toLowerCase().trim();
      if (!VALID_ASSET_STATUSES.includes(status as AssetStatus)) {
        console.log(`Invalid status "${status}" for asset "${asset.name}", defaulting to "ready"`);
        status = 'ready';
      }
      
      const { error } = await supabase.from('assets').insert([{
        name: asset.name,
        tag: asset.tag,
        serial: asset.serial || '',
        model: asset.model || '',
        category: category,
        status: status as AssetStatus,
        assigned_to: asset.assigned_to || null,
        purchase_date: asset.purchase_date ? new Date(asset.purchase_date).toISOString() : null,
        purchase_cost: asset.purchase_cost ? parseFloat(asset.purchase_cost) : null,
        location: asset.location || '',
        wear: asset.wear || null,
        qty: asset.qty ? parseInt(asset.qty) : 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id
      }]);
      
      if (error) {
        console.error('Error importing asset:', error);
        importErrors.push(asset.name);
      } else {
        importSuccess.push(asset.name);
      }
    } catch (error) {
      console.error('Error importing asset:', error);
      importErrors.push(asset.name);
    }
  }
      
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      
      logActivity({
        title: `Assets Imported from ${importFileType.toUpperCase()}`,
        description: `${importSuccess.length} assets imported successfully, ${importErrors.length} failed`,
        category: 'asset',
        icon: <Package className="h-5 w-5 text-blue-600" />
      });

      if (importErrors.length > 0) {
        toast({
          title: "Import Partially Successful",
          description: `${importSuccess.length} assets imported, ${importErrors.length} failed`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Import Successful",
          description: `${importSuccess.length} assets imported`,
        });
      }
      
      setShowCSVPreview(false);
      setCsvContent(null);
      setCsvPreviewData(null);
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: "The file format is invalid or there was an error processing your request",
        variant: "destructive",
      });
    }
  };

  const handleExportTemplateClick = () => {
    downloadCSV(generateAssetImportTemplate(), "assets-import-template.csv");
    
    toast({
      title: "Template Exported",
      description: "Asset import template with all columns has been downloaded",
    });
    
    logActivity({
      title: "Template Downloaded",
      description: "Asset import template downloaded",
      category: 'asset',
      icon: <FileSpreadsheet className="h-5 w-5 text-blue-600" />
    });
  };

  const handleExportClick = () => {
    if (assets.length === 0) {
      handleExportTemplateClick();
      return;
    }

    const formattedAssets = assets.map(asset => ({
      tag: asset.tag,
      name: asset.name,
      assigned_to: asset.assigned_to || '',
      purchase_date: asset.purchase_date || '',
      wear: asset.notes || '',
      purchase_cost: asset.purchase_cost || '',
      qty: '1',
    }));
    
    const csv = objectsToCSV(formattedAssets);
    downloadCSV(csv, "assets-export.csv");
    
    logActivity({
      title: "Assets Exported",
      description: `${assets.length} assets exported`,
      category: 'asset',
      icon: <Package className="h-5 w-5 text-blue-600" />
    });

    toast({
      title: "Export Successful",
      description: `${assets.length} assets exported`,
    });
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const renderFilterPopover = (
    title: string, 
    options: string[], 
    filterKey: keyof Filters
  ) => {
    const selectedFilters = activeFilters[filterKey];
    const [searchFilter, setSearchFilter] = useState("");
    
    const filteredOptions = searchFilter 
      ? options.filter(option => 
          option.toLowerCase().includes(searchFilter.toLowerCase()))
      : options;
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 px-2 ${isFilterActive(filterKey) ? 'bg-accent text-accent-foreground' : ''}`}
          >
            <ArrowUpDown className="h-3 w-3 mr-2" />
            {title}
            {isFilterActive(filterKey) && (
              <Badge variant="secondary" className="ml-2 px-1 font-normal">
                {selectedFilters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <div className="p-2">
            <div className="flex items-center justify-between pb-2">
              <h4 className="font-medium text-sm">{title} Filter</h4>
              <Button
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={() => clearFilters(filterKey)}
                disabled={selectedFilters.length === 0}
              >
                Reset
              </Button>
            </div>
            
            {filterKey === 'assignedTo' && options.length > 5 && (
              <div className="relative mb-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-8 h-9"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>
            )}
            
            <div className="max-h-[300px] overflow-auto space-y-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${filterKey}-${option}`}
                      checked={selectedFilters.includes(option)}
                      onCheckedChange={() => toggleFilter(filterKey, option)}
                    />
                    <label 
                      htmlFor={`${filterKey}-${option}`}
                      className="text-sm font-normal cursor-pointer flex-1 truncate"
                    >
                      {option || "(Empty)"}
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground py-2 text-center">
                  {searchFilter ? "No matching results" : "No options available"}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Error Loading Assets</h1>
        <p className="text-muted-foreground mb-4">{(error as Error).message || 'Failed to load assets from the database.'}</p>
        <div className="flex gap-2">
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['assets'] })}>
            Try Again
          </Button>
          <Button variant="outline" onClick={handleDebug}>
            Debug Access
          </Button>
        </div>
      </div>
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
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".csv,.xlsx,.xls" 
            onChange={handleFileChange}
            className="hidden"
          />
          <Button className="" size="sm" onClick={handleImportClick}>
            <Import className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button className="" size="sm" onClick={handleExportClick}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button className="" size="sm" onClick={handleExportTemplateClick} variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Template
          </Button>
          <Button className="" size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
          <Button className="" size="sm" variant="outline" onClick={handleDebug} disabled={isDebugging}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isDebugging ? 'animate-spin' : ''}`} />
            Debug
          </Button>
          <Button className="" size="sm" variant="destructive" onClick={handleDeleteAllAssets}>
            <Trash className="mr-2 h-4 w-4" />
            Delete All
          </Button>
        </div>
      </div>
      
      {debugInfo && (
        <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-4">
          <h3 className="font-medium text-amber-900 mb-2">Debug Information</h3>
          <div className="text-sm text-amber-800">
            <p>Authentication status: {debugInfo.authenticated ? 'Authenticated' : 'Not authenticated'}</p>
            <p>Data received: {debugInfo.data ? debugInfo.data.length : 0} assets</p>
            {debugInfo.error && (
              <p className="text-red-600">Error: {debugInfo.error.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
