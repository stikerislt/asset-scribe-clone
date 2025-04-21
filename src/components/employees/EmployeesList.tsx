
import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Loader, X, Pencil, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Employee, updateEmployee } from "@/lib/api/employees";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface EmployeesListProps {
  employees: Employee[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onAddEmployee: () => void;
}

export const EmployeesList = ({ employees, isLoading, error, onAddEmployee }: EmployeesListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, { email?: string, role?: string, department?: string }>>({});
  const [savingEmployee, setSavingEmployee] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter employees based on search
  const filteredEmployees = employees?.filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (employee: Employee) => {
    setEditingEmployeeId(employee.id);
    setEditedValues({
      ...editedValues,
      [employee.id]: { 
        email: employee.email || "", 
        role: employee.role || "", 
        department: employee.department || "" 
      }
    });
  };

  const cancelEditing = () => {
    setEditingEmployeeId(null);
  };

  const handleInputChange = (employeeId: string, field: 'email' | 'role' | 'department', value: string) => {
    setEditedValues({
      ...editedValues,
      [employeeId]: { 
        ...editedValues[employeeId],
        [field]: value
      }
    });
  };

  const saveChanges = async (employee: Employee) => {
    const updates = editedValues[employee.id];
    if (!updates) return;

    setSavingEmployee(employee.id);
    try {
      // Log the data being sent to help debug
      console.log("Updating employee:", employee.name, "with data:", updates);
      
      await updateEmployee(employee.name, {
        email: updates.email,
        role: updates.role,
        department: updates.department
      });
      
      toast({
        title: "Employee updated",
        description: `${employee.name}'s information has been updated.`
      });
      
      // Refresh employee data
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', employee.name] });
      
      setEditingEmployeeId(null);
    } catch (error) {
      console.error("Error updating employee:", error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update employee information.",
        variant: "destructive"
      });
    } finally {
      setSavingEmployee(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 mt-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search" 
            placeholder="Search employees..." 
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader className="h-8 w-8 animate-spin mb-4" />
          <p>Loading employees...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-destructive mb-2">Failed to load employees</p>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      ) : filteredEmployees && filteredEmployees.length > 0 ? (
        <div className="rounded-md border mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Assets</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Link to={`/employees/${encodeURIComponent(employee.name)}`} className="hover:underline">
                      {employee.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {editingEmployeeId === employee.id ? (
                      <Input 
                        value={editedValues[employee.id]?.email || ""}
                        onChange={(e) => handleInputChange(employee.id, 'email', e.target.value)}
                        placeholder="Email address"
                        className="max-w-[200px]"
                      />
                    ) : (
                      employee.email || "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {editingEmployeeId === employee.id ? (
                      <Input 
                        value={editedValues[employee.id]?.role || ""}
                        onChange={(e) => handleInputChange(employee.id, 'role', e.target.value)}
                        placeholder="Role/Position"
                        className="max-w-[200px]"
                      />
                    ) : (
                      employee.role || "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {editingEmployeeId === employee.id ? (
                      <Input 
                        value={editedValues[employee.id]?.department || ""}
                        onChange={(e) => handleInputChange(employee.id, 'department', e.target.value)}
                        placeholder="Department"
                        className="max-w-[200px]"
                      />
                    ) : (
                      employee.department || "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="link" asChild>
                      <Link to={`/assets?assigned=${encodeURIComponent(employee.name)}`}>
                        View Assets
                      </Link>
                    </Button>
                  </TableCell>
                  <TableCell>
                    {editingEmployeeId === employee.id ? (
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => saveChanges(employee)}
                          disabled={savingEmployee === employee.id}
                        >
                          {savingEmployee === employee.id ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={cancelEditing}
                          disabled={savingEmployee === employee.id}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => startEditing(employee)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                        >
                          <Link to={`/employees/${encodeURIComponent(employee.name)}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center mt-4">
          <p className="text-muted-foreground mb-2">No employees found</p>
          {searchQuery ? (
            <div>
              <p className="text-muted-foreground mb-4">Try using different search terms</p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>Clear Search</Button>
            </div>
          ) : (
            <Button onClick={onAddEmployee}>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          )}
        </div>
      )}
    </>
  );
};
