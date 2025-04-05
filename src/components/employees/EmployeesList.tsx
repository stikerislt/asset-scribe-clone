
import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Loader, X } from "lucide-react";
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
import { Employee } from "@/lib/api/employees";

interface EmployeesListProps {
  employees: Employee[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onAddEmployee: () => void;
}

export const EmployeesList = ({ employees, isLoading, error, onAddEmployee }: EmployeesListProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter employees based on search
  const filteredEmployees = employees?.filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <TableHead>Assets</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
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
                  <TableCell>{employee.email || "—"}</TableCell>
                  <TableCell>{employee.role || "—"}</TableCell>
                  <TableCell>
                    <Button variant="link" asChild>
                      <Link to={`/assets?assigned=${encodeURIComponent(employee.name)}`}>
                        View Assets
                      </Link>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      asChild
                    >
                      <Link to={`/employees/${encodeURIComponent(employee.name)}`}>
                        View
                      </Link>
                    </Button>
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
