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

interface Asset {
  id: string;
  name: string;
  category: string;
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
  
  if (isLoading) {
    return <p>Loading assets...</p>;
  }

  if (error) {
    return <p className="text-red-500">Failed to load assets</p>;
  }

  if (!assets || assets.length === 0) {
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
    ? assets.filter(asset => 
        asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        asset.category?.toLowerCase().includes(searchTerm.toLowerCase()))
    : assets;

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
                      <StatusColorIndicator color={asset.status_color} />
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
