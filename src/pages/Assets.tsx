
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
  Upload,
  Import,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Asset, assets } from "@/lib/data";
import { csvToObjects, objectsToCSV, generateAssetImportTemplate } from "@/lib/csv-utils";
import { useActivity } from "@/hooks/useActivity";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AssetForm } from "@/components/AssetForm";

const Assets = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [assetsList, setAssetsList] = useState<Asset[]>(assets);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { logActivity } = useActivity();
  
  const filteredAssets = assetsList.filter(asset => 
    asset?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset?.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset?.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImportClick = () => {
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target?.result as string;
      try {
        const importedAssets = csvToObjects<Asset>(csvContent);
        
        // Validate imported assets
        const validAssets = importedAssets
          .filter(asset => asset.name && asset.tag)
          .map((asset, index) => ({
            ...asset,
            id: crypto.randomUUID(), // Generate unique IDs for new assets
          }));

        if (validAssets.length === 0) {
          toast({
            title: "Import Failed",
            description: "No valid assets found in the file",
            variant: "destructive",
          });
          return;
        }

        // Update assets list
        setAssetsList(prevAssets => [...prevAssets, ...validAssets]);
        
        // Log activity
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

    // Reset file input
    event.target.value = '';
  };

  const handleExportClick = () => {
    // If no assets, export template
    if (assetsList.length === 0) {
      downloadCSV(generateAssetImportTemplate(), "assets-template.csv");
      toast({
        title: "Template Exported",
        description: "Asset import template has been downloaded",
      });
      return;
    }

    // Export current assets
    const csv = objectsToCSV(assetsList);
    downloadCSV(csv, "assets-export.csv");
    
    logActivity({
      title: "Assets Exported",
      description: `${assetsList.length} assets exported`,
      category: 'asset',
      icon: <Package className="h-5 w-5 text-blue-600" />
    });

    toast({
      title: "Export Successful",
      description: `${assetsList.length} assets exported`,
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

  const handleAddAsset = (newAsset: Asset) => {
    setAssetsList(prev => [...prev, newAsset]);
    setIsAddDialogOpen(false);
    
    toast({
      title: "Asset Created",
      description: `${newAsset.name} has been added to the inventory`,
    });
  };
  
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Assets</h1>
          <p className="text-muted-foreground mt-1">Manage your hardware and device inventory</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          {/* Hidden file input for import */}
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
                <TableHead>Asset Tag</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
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
                      <div className="text-xs text-muted-foreground">
                        S/N: {asset.serial}
                      </div>
                    </TableCell>
                    <TableCell>{asset.category}</TableCell>
                    <TableCell>
                      <AssetStatusBadge status={asset.status} />
                    </TableCell>
                    <TableCell>
                      {asset.assignedTo || <span className="text-gray-400">—</span>}
                    </TableCell>
                    <TableCell>{asset.location}</TableCell>
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

      {/* Add Asset Dialog */}
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
