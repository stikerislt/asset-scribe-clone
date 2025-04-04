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
  FileSpreadsheet
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Asset, AssetStatus, debugAssetAccess } from "@/lib/data";
import { csvToObjects, objectsToCSV, generateAssetImportTemplate } from "@/lib/csv-utils";
import { parseCSVForPreview } from "@/lib/preview-csv";
import { useActivity } from "@/hooks/useActivity";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AssetForm } from "@/components/AssetForm";
import { CSVPreview } from "@/components/CSVPreview";
import { supabase, checkAuth } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast as sonnerToast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Assets = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [csvPreviewData, setCsvPreviewData] = useState<{ headers: string[], data: string[][] } | null>(null);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [showCSVPreview, setShowCSVPreview] = useState(false);
  const [importFileType, setImportFileType] = useState<'csv' | 'excel'>('csv');
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
  
  const handleAddAsset = async (assetData: Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      await createAssetMutation.mutateAsync({
        ...assetData,
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
  
  const filteredAssets = assets.filter(asset => 
    asset?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset?.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset?.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          status: AssetStatus;
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

      for (const asset of validAssets) {
        try {
          const { error } = await supabase.from('assets').insert([{
            name: asset.name,
            tag: asset.tag,
            serial: asset.serial || '',
            model: asset.model || '',
            category: asset.category,
            status: asset.status as AssetStatus,
            assigned_to: asset.assigned_to || null,
            purchase_date: asset.purchase_date ? new Date(asset.purchase_date).toISOString() : null,
            purchase_cost: asset.purchase_cost ? parseFloat(asset.purchase_cost) : null,
            location: asset.location || '',
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

  const handleExportClick = () => {
    if (assets.length === 0) {
      downloadCSV(generateAssetImportTemplate(), "assets-template.csv");
      toast({
        title: "Template Exported",
        description: "Asset import template has been downloaded",
      });
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
          <Button className="" size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
          <Button className="" size="sm" variant="outline" onClick={handleDebug} disabled={isDebugging}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isDebugging ? 'animate-spin' : ''}`} />
            Debug
          </Button>
        </div>
      </div>
      
      {debugInfo && (
        <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-4">
          <h3 className="font-medium text-amber-900 mb-2">Debug Information</h3>
          <div className="text-sm text-amber-800">
            <p>Authentication status: {debugInfo.authenticated ? 'Authenticated' : 'Not authenticated'}</p>
            <p>Data received: {debugInfo.data ? debugInfo.data.length : 0} assets</p>
            {debugInfo.error && <p>Error: {debugInfo.error.message}</p>}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={() => setDebugInfo(null)}
          >
            Dismiss
          </Button>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IN</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Wear</TableHead>
                <TableHead>Purchase Cost</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Loader className="h-8 w-8 animate-spin mb-2 text-muted-foreground/50" />
                      <p>Loading assets...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Package className="h-12 w-12 mb-2 text-muted-foreground/50" />
                      <p>No assets found. Click the Import or Add Asset button to get started.</p>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => queryClient.invalidateQueries({ queryKey: ['assets'] })}
                        >
                          Refresh Data
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={handleDebug}
                          disabled={isDebugging}
                        >
                          Debug Access
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>{asset.tag}</TableCell>
                    <TableCell>
                      <Link to={`/assets/${asset.id}`} className="font-medium hover:underline text-blue-600">
                        {asset.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {asset.assigned_to || <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>
                      {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {asset.notes || <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>
                      {asset.purchase_cost ? `$${asset.purchase_cost.toFixed(2)}` : <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>1</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Assign
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
          </DialogHeader>
          <AssetForm 
            onSubmit={handleAddAsset}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={showCSVPreview} onOpenChange={(value) => {
        if (!value) {
          setShowCSVPreview(false);
          setCsvPreviewData(null);
          setCsvContent(null);
        }
      }}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Preview Import Data 
              {importFileType === 'excel' && <span className="text-blue-600 ml-2">(Excel)</span>}
            </DialogTitle>
          </DialogHeader>
          {csvPreviewData && (
            <CSVPreview
              headers={csvPreviewData.headers}
              data={csvPreviewData.data}
              onConfirm={handleConfirmImport}
              onCancel={() => {
                setShowCSVPreview(false);
                setCsvPreviewData(null);
                setCsvContent(null);
              }}
              fileType={importFileType}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assets;
