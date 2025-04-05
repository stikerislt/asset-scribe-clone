
import { Link } from "react-router-dom";
import { AssetStatusBadge } from "@/components/AssetStatusBadge";
import { Button } from "@/components/ui/button";
import { AssetStatus } from "@/lib/data";
import { Package } from "lucide-react";

interface Asset {
  id: string;
  name: string;
  category: string;
  status: AssetStatus;
}

interface EmployeeAssetsTableProps {
  assets: Asset[];
  isLoading: boolean;
  error: Error | null;
}

export function EmployeeAssetsTable({ assets, isLoading, error }: EmployeeAssetsTableProps) {
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

  return (
    <div className="rounded-md border">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="border-b">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="p-4 align-middle">{asset.name}</td>
                <td className="p-4 align-middle">{asset.category}</td>
                <td className="p-4 align-middle">
                  <AssetStatusBadge status={asset.status} />
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
  );
}
