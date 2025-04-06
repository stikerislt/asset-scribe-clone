
import { useState } from "react";
import { Link } from "react-router-dom";
import { AssetStatusBadge } from "@/components/AssetStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusColor } from "@/lib/data";
import { AssetStatus } from "@/lib/api/assets";
import { Package, Search } from "lucide-react";
import { StatusColorIndicator } from "@/components/StatusColorIndicator";
import { CategoryIcon } from "@/components/CategoryIcon";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useActivity } from "@/hooks/useActivity";
import { supabase } from "@/integrations/supabase/client";

interface Asset {
  id: string;
  name: string;
  category: string;
  categoryIcon?: string;
  status: AssetStatus;
  status_color?: StatusColor | null;
}

interface EmployeeAssetsTableProps {
  assets: Asset[];
  isLoading: boolean;
  error: Error | null;
}

export function EmployeeAssetsTable({ assets, isLoading, error }: EmployeeAssetsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [localAssets, setLocalAssets] = useState<Asset[]>(assets);
  const { toast } = useToast();
  const { logActivity } = useActivity();
  
  // Update local assets when props change
  if (JSON.stringify(assets) !== JSON.stringify(localAssets)) {
    setLocalAssets(assets);
  }
  
  if (isLoading) {
    return <p>Loading assets...</p>;
  }

  if (error) {
    return <p className="text-red-500">Failed to load assets</p>;
  }

  if (!localAssets || localAssets.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-2" />
        <p className="text-muted-foreground mb-4">No assets assigned to this employee</p>
        <Button asChild>
          <Link to="/assets">Browse Assets</Link>
        </Button>
      </div>
    );
  }
  
  const filteredAssets = searchTerm 
    ? localAssets.filter(asset => 
        asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        asset.category?.toLowerCase().includes(searchTerm.toLowerCase()))
    : localAssets;
    
  const handleStatusColorChange = async (assetId: string, newColor: StatusColor) => {
    try {
      // Update in the database
      const { error } = await supabase
        .from('assets')
        .update({ status_color: newColor })
        .eq('id', assetId);
      
      if (error) throw error;
      
      // Update local state without changing order
      setLocalAssets(prevAssets => 
        prevAssets.map(asset => 
          asset.id === assetId ? { ...asset, status_color: newColor } : asset
        )
      );
      
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

  return (
    <>
      <div className="relative w-full mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by asset name or category..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Condition</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={asset.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle">{asset.name}</td>
                  <td className="p-4 align-middle">
                    <CategoryIcon 
                      category={asset.category} 
                      iconType={asset.categoryIcon} 
                      size={16} 
                    />
                  </td>
                  <td className="p-4 align-middle">
                    <AssetStatusBadge status={asset.status} />
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center">
                      <RadioGroup 
                        value={asset.status_color || 'green'} 
                        className="flex flex-row space-x-1"
                        onValueChange={(value) => handleStatusColorChange(asset.id, value as StatusColor)}
                      >
                        <div className="flex items-center">
                          <RadioGroupItem 
                            value="green" 
                            id={`green-${asset.id}`}
                            className="sr-only peer"
                          />
                          <label
                            htmlFor={`green-${asset.id}`}
                            className={`h-4 w-4 rounded-full bg-green-500 cursor-pointer ring-offset-background hover:bg-green-600 transition-colors ${asset.status_color === 'green' ? 'ring-2 ring-ring ring-offset-2' : ''}`}
                          />
                        </div>
                        <div className="flex items-center">
                          <RadioGroupItem 
                            value="yellow" 
                            id={`yellow-${asset.id}`}
                            className="sr-only peer"
                          />
                          <label
                            htmlFor={`yellow-${asset.id}`}
                            className={`h-4 w-4 rounded-full bg-yellow-500 cursor-pointer ring-offset-background hover:bg-yellow-600 transition-colors ${asset.status_color === 'yellow' ? 'ring-2 ring-ring ring-offset-2' : ''}`}
                          />
                        </div>
                        <div className="flex items-center">
                          <RadioGroupItem 
                            value="red" 
                            id={`red-${asset.id}`}
                            className="sr-only peer"
                          />
                          <label
                            htmlFor={`red-${asset.id}`}
                            className={`h-4 w-4 rounded-full bg-red-500 cursor-pointer ring-offset-background hover:bg-red-600 transition-colors ${asset.status_color === 'red' ? 'ring-2 ring-ring ring-offset-2' : ''}`}
                          />
                        </div>
                      </RadioGroup>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/assets/${asset.id}`}>
                        View
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
