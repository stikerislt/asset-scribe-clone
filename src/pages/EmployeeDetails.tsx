
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getEmployeeById } from "@/lib/api/employees";
import { getAssetsByEmployeeName, Asset as ApiAsset } from "@/lib/api/assets";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { EmployeeProfileCard } from "@/components/employees/EmployeeProfileCard";
import { AssetsCard } from "@/components/employees/AssetsCard";
import { EmployeeDetailsLoading } from "@/components/employees/EmployeeDetailsLoading";
import { EmployeeDetailsError } from "@/components/employees/EmployeeDetailsError";

const EmployeeDetails = () => {
  const { id } = useParams();
  
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
    return <EmployeeDetailsLoading />;
  }

  if (employeeError || !employee) {
    return <EmployeeDetailsError />;
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center mb-6">
        <Button variant="ghost" asChild className="mr-4">
          <Link to="/employees">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{employee.name}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Employee Info Card */}
        <div className="md:col-span-1">
          <EmployeeProfileCard 
            employee={employee} 
            assetsCount={assets?.length || 0} 
          />
        </div>

        {/* Assets Card */}
        <div className="md:col-span-2">
          <AssetsCard 
            assets={assets} 
            isLoading={isLoadingAssets}
            error={assetsError as Error} 
          />
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
