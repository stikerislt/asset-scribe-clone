
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeAssetsTable } from "./EmployeeAssetsTable";
import { AssetStatus } from "@/lib/api/assets";

interface Asset {
  id: string;
  name: string;
  category: string;
  status: AssetStatus;
}

interface AssetsCardProps {
  assets: Asset[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function AssetsCard({ assets, isLoading, error }: AssetsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Assets</CardTitle>
        <CardDescription>
          Assets currently assigned to this employee
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <EmployeeAssetsTable 
            assets={assets || []} 
            isLoading={isLoading} 
            error={error} 
          />
        )}
      </CardContent>
    </Card>
  );
}
