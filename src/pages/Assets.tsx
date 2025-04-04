import { useState, useRef } from "react";
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Asset, AssetStatus } from "@/lib/data";
import { csvToObjects, objectsToCSV, generateAssetImportTemplate } from "@/lib/csv-utils";
import { useActivity } from "@/hooks/useActivity";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AssetForm } from "@/components/AssetForm";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Assets = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { logActivity } = useActivity();
  const queryClient = useQueryClient();
  
  const { data: assets = [], isLoading, error } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('*');
      
      if (error) {
        throw new Error(error.message);
      }
      
      const assetsWithNotes = data?.map(asset => ({
        ...asset,
        notes: asset.location
      })) || [];
      
      return assetsWithNotes;
    }
  });
  
  const createAssetMutation = useMutation({
    mutationFn: async (newAsset: Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data, error } = await supabase
        .from('assets')
        .insert([{
          ...newAsset,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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
  
  const handleAddAsset = async (newAsset: Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      await createAssetMutation.mutateAsync({
        ...newAsset,
        user_id: null
      });
      
      setIsAddDialogOpen(false);
      
      toast({
        title: "Asset Created",
        description: `${newAsset.name} has been added to the inventory`,
      });
      
      logActivity({
        title: "Asset Created",
        description: `${newAsset.name} added to inventory`,
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

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvContent = e.target?.result as string;
      try {
        const importedAssets = csvToObjects<{
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

        for (const asset of validAssets) {
          try {
            await supabase.from('assets').insert([{
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
              user_id: null
            }]);
          } catch (error) {
            console.error('Error importing asset:', error);
          }
        }
        
        queryClient.invalidateQueries({ queryKey: ['assets'] });
        
        logActivity({
          title: "Assets Imported",
          description: `${validAssets.length} assets imported`,
          category: 'asset',
          icon: <Package className="h-5 w-5 text-blue-600" />
        });

        toast({
          title: "Import Successful",
          description: `${validAssets.length} assets imported`,
        });
      } catch (error) {
        console.error("CSV import error:", error);
        toast({
          title: "Import Failed",
          description: "The file format is invalid",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);

    event.target.value = '';
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
      name: asset.name,
      tag: asset.tag,
      serial: asset.serial || '',
      model: asset.model || '',
      category: asset.category,
      status: asset.status,
      assigned_to: asset.assigned_to || '',
      location: asset.location || '',
      purchase_date: asset.purchase_date || '',
      purchase_cost: asset.purchase_cost || '',
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
        <h1 className="text-xl font-bold mb-2">Error Loading Assets</h1>
        <p className="text-muted-foreground mb-4">Failed to load assets from the database.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['assets'] })}>
          Try Again
        </Button>
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
        <div className="flex gap-2 mt-4 sm:mt-0">
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".csv" 
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
        </div>
      </div>
      
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
                <TableHead>Serial</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Purchase Cost</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Loader className="h-8 w-8 animate-spin mb-2 text-muted-foreground/50" />
                      <p>Loading assets...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Package className="h-12 w-12 mb-2 text-muted-foreground/50" />
                      <p>No assets found. Click the Import or Add Asset button to get started.</p>
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
                      {asset.serial || <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>{asset.category}</TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {asset.notes || <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>
                      <AssetStatusBadge status={asset.status as AssetStatus} />
                    </TableCell>
                    <TableCell>
                      {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>
                      {asset.purchase_cost ? `$${asset.purchase_cost.toFixed(2)}` : <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>
                      {asset.assigned_to || <span className="text-gray-400">—</span>}
                    </TableCell>
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
    </div>
  );
};

export default Assets;
