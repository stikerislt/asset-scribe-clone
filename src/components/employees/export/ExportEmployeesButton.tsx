
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { objectsToCSV } from "@/lib/csv/csv-export";
import { Employee } from "@/lib/api/employees";
import { useToast } from "@/hooks/use-toast";

interface ExportEmployeesButtonProps {
  employees: Employee[] | undefined;
  isLoading?: boolean;
}

export const ExportEmployeesButton = ({ employees, isLoading = false }: ExportEmployeesButtonProps) => {
  const { toast } = useToast();
  
  const handleExport = () => {
    if (!employees || employees.length === 0) {
      toast({
        title: "No employees to export",
        description: "There are no employees available to export.",
        variant: "destructive",
      });
      return;
    }

    // Format data for export
    const formattedEmployees = employees.map(employee => ({
      name: employee.name,
      email: employee.email || "",
      role: employee.role || "",
    }));

    // Generate CSV and trigger download
    const csv = objectsToCSV(formattedEmployees);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `employees-export-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export successful",
      description: `${employees.length} employees exported as CSV`,
    });
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport} 
      disabled={isLoading || !employees || employees.length === 0}
    >
      <Download className="mr-2 h-4 w-4" />
      Export
    </Button>
  );
};
