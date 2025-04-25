import { useState, useEffect } from "react";
import { Asset, AssetStatus } from "@/lib/api/assets";
import { StatusColor } from "@/lib/data";
import { AssetStatusBadge } from "@/components/AssetStatusBadge";
import { Link } from "react-router-dom";
import { StatusColorIndicator } from "@/components/StatusColorIndicator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ColumnDef } from "@/components/assets/ColumnVisibilityDropdown";
import { CategoryIcon } from "@/components/CategoryIcon";
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
import { MoreHorizontal, Edit, Trash, UserPlus } from "lucide-react";
import { useActivity } from "@/hooks/useActivity";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface AssetTableProps {
  assets: Asset[];
  columns: ColumnDef[];
  onDeleteAsset: (asset: Asset) => void;
  onStatusColorChange: (assetId: string, newColor: StatusColor) => void;
}

export const AssetTable = ({ 
  assets, 
  columns, 
  onDeleteAsset,
  onStatusColorChange 
}: AssetTableProps) => {
  const { toast } = useToast();
  const { logActivity } = useActivity();
  const [localAssets, setLocalAssets] = useState<Asset[]>(assets);
  
  const { data: userRole = 'user' } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return 'user';
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (error || !data) return 'user';
      return data.role;
    },
  });

  const hasAdminPrivileges = userRole === 'admin' || userRole === 'manager';

  const sortAssetsByPriority = (assetsToSort: Asset[]): Asset[] => {
    return [...assetsToSort].sort((a, b) => {
      if (a.status_color === 'yellow' && b.status_color !== 'yellow') return -1;
      if (a.status_color !== 'yellow' && b.status_color === 'yellow') return 1;
      return 0;
    });
  };
  
  useEffect(() => {
    const currentIds = localAssets.map(asset => asset.id).join(',');
    const newIds = assets.map(asset => asset.id).join(',');
    
    if (currentIds !== newIds || localAssets.length !== assets.length) {
      setLocalAssets(sortAssetsByPriority(assets));
    } else {
      setLocalAssets(prevAssets => {
        const updatedAssets = prevAssets.map(prevAsset => {
          const updatedAsset = assets.find(a => a.id === prevAsset.id);
          return updatedAsset ? { ...prevAsset, ...updatedAsset } : prevAsset;
        });
        return sortAssetsByPriority(updatedAssets);
      });
    }
  }, [assets]);
  
  if (localAssets.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md">
        <p className="text-muted-foreground">No assets found</p>
      </div>
    );
  }
  
  const handleStatusColorChange = (assetId: string, newColor: StatusColor) => {
    setLocalAssets(prevAssets => {
      const updatedAssets = prevAssets.map(asset => 
        asset.id === assetId ? { ...asset, status_color: newColor } : asset
      );
      return sortAssetsByPriority(updatedAssets);
    });
    
    onStatusColorChange(assetId, newColor);
  };
  
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.filter(col => col.isVisible).map((column) => (
              <TableHead key={column.id}>
                {column.label}
              </TableHead>
            ))}
            <TableHead>Status</TableHead>
            <TableHead>Status Color</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {localAssets.map((asset) => (
            <TableRow key={asset.id}>
              {columns.find(c => c.id === 'tag')?.isVisible && (
                <TableCell>
                  <Link to={`/assets/${asset.id}`} className="font-medium hover:underline">
                    {asset.tag}
                  </Link>
                </TableCell>
              )}
              
              {columns.find(c => c.id === 'name')?.isVisible && (
                <TableCell>{asset.name}</TableCell>
              )}
              
              {columns.find(c => c.id === 'category')?.isVisible && (
                <TableCell>
                  <CategoryIcon 
                    category={asset.category} 
                    iconType={asset.categoryIcon}
                  />
                </TableCell>
              )}
              
              {columns.find(c => c.id === 'assignedTo')?.isVisible && (
                <TableCell>{asset.assigned_to || '-'}</TableCell>
              )}
              
              {columns.find(c => c.id === 'purchaseDate')?.isVisible && (
                <TableCell>
                  {asset.purchase_date 
                    ? new Date(asset.purchase_date).toLocaleDateString() 
                    : '-'}
                </TableCell>
              )}
              
              {columns.find(c => c.id === 'wear')?.isVisible && (
                <TableCell>{asset.wear || '-'}</TableCell>
              )}
              
              {columns.find(c => c.id === 'purchaseCost')?.isVisible && (
                <TableCell>
                  {asset.purchase_cost 
                    ? `$${asset.purchase_cost.toFixed(2)}` 
                    : '-'}
                </TableCell>
              )}
              
              {columns.find(c => c.id === 'quantity')?.isVisible && (
                <TableCell>{asset.qty || 1}</TableCell>
              )}
              
              <TableCell>
                <AssetStatusBadge status={asset.status} />
              </TableCell>
              
              <TableCell>
                {hasAdminPrivileges && (
                  <div className="flex items-center space-x-2">
                    <RadioGroup 
                      value={asset.status_color || 'green'} 
                      className="flex flex-row"
                      onValueChange={(value) => handleStatusColorChange(asset.id, value as StatusColor)}
                    >
                      <div className="flex items-center space-x-1">
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
                      <div className="flex items-center space-x-1">
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
                      <div className="flex items-center space-x-1">
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
                )}
              </TableCell>
              
              <TableCell>
                {hasAdminPrivileges ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <MoreHorizontal className="h-5 w-5" />
                      <span className="sr-only">Open menu</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={`/assets/${asset.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/assets/${asset.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Asset
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/employees?assign=${asset.id}`}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Assign
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => onDeleteAsset(asset)}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/assets/${asset.id}`}>
                      View
                    </Link>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
