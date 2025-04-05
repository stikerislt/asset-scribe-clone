
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getEmployeeById } from "@/lib/api/employees";
import { getAssetsByEmployeeName } from "@/lib/api/assets";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, User2, Briefcase, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetStatusBadge } from "@/components/AssetStatusBadge";

const EmployeeDetails = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  
  const { 
    data: employee,
    isLoading: isLoadingEmployee,
    error: employeeError
  } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => getEmployeeById(id as string)
  });

  const {
    data: assets,
    isLoading: isLoadingAssets,
    error: assetsError
  } = useQuery({
    queryKey: ['employeeAssets', employee?.name],
    queryFn: () => getAssetsByEmployeeName(employee?.name || ""),
    enabled: !!employee?.name
  });

  if (isLoadingEmployee) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="flex items-center mb-6">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/employees">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-12 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (employeeError) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="flex items-center mb-6">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/employees">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Employee Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">There was an error loading this employee's information.</p>
            <Button variant="default" asChild className="mt-4">
              <Link to="/employees">Return to Employees List</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center mb-6">
        <Button variant="ghost" asChild className="mr-4">
          <Link to="/employees">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{employee?.name}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Employee Info Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Employee Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-4">
              <Avatar className="h-24 w-24 mb-2">
                <AvatarImage src={employee?.avatar} alt={employee?.name} />
                <AvatarFallback>{getInitials(employee?.name || "")}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{employee?.name}</h2>
              <p className="text-muted-foreground">{employee?.role || "No role specified"}</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{employee?.email || "No email available"}</span>
              </div>
              <div className="flex items-center">
                <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{employee?.role || "No role specified"}</span>
              </div>
              <div className="flex items-center">
                <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>{assets?.length || 0} assigned assets</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assets Tab */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Assigned Assets</CardTitle>
            <CardDescription>
              Assets currently assigned to this employee
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAssets ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : assetsError ? (
              <p className="text-red-500">Failed to load assets</p>
            ) : assets && assets.length > 0 ? (
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
            ) : (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-2" />
                <p className="text-muted-foreground mb-4">No assets assigned to this employee</p>
                <Button asChild>
                  <Link to="/assets">Browse Assets</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDetails;
