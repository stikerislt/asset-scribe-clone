
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getEmployees } from "@/lib/api/employees";
import { EmployeesList } from "@/components/employees/EmployeesList";
import { AddEmployeeDialog } from "@/components/employees/AddEmployeeDialog";
import { ExportEmployeesButton } from "@/components/employees/export/ExportEmployeesButton";
import { ImportEmployeesButton } from "@/components/employees/import/ImportEmployeesButton";

const Employees = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Get unique employees from assets
  const { data: employees, isLoading, error, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees
  });

  return (
    <div className="animate-fade-in p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage your organization's employees</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <ImportEmployeesButton onImportComplete={refetch} />
          <ExportEmployeesButton employees={employees} isLoading={isLoading} />
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
          <CardDescription>
            View and manage employees across the organization
          </CardDescription>
          <EmployeesList 
            employees={employees}
            isLoading={isLoading}
            error={error as Error | null}
            onAddEmployee={() => setIsAddDialogOpen(true)}
          />
        </CardHeader>
        <CardContent>
          {/* The card content is intentionally left empty as the list component handles 
              all display logic including loading, error, and empty states */}
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <AddEmployeeDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
};

export default Employees;
