
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  UserPlus, 
  Search, 
  Plus,
  Loader,
  X
} from "lucide-react";
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
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Employee {
  id: string;
  name: string;
  role?: string;
  email?: string;
}

const Employees = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    fullName: "",
    email: "",
    role: ""
  });
  const queryClient = useQueryClient();

  // Get unique employees from assets
  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      // First get all assigned_to values from assets
      const { data: assets, error } = await supabase
        .from('assets')
        .select('assigned_to')
        .not('assigned_to', 'is', null);
      
      if (error) throw error;
      
      // Get unique employee names
      const uniqueEmployees = Array.from(
        new Set(
          assets
            .filter(asset => asset.assigned_to)
            .map(asset => asset.assigned_to)
        )
      ).map(name => ({ 
        id: name as string, 
        name: name as string 
      }));
      
      // Get profiles data to merge with employees
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      
      // Combine data if available
      const employeesList = uniqueEmployees.map(employee => {
        const profileMatch = profiles?.find(profile => profile.full_name === employee.name);
        if (profileMatch) {
          return {
            ...employee,
            email: profileMatch.email
          };
        }
        return employee;
      });
      
      return employeesList as Employee[];
    }
  });
  
  // Add new employee mutation
  const addEmployeeMutation = useMutation({
    mutationFn: async (employee: { fullName: string, email: string, role?: string }) => {
      // In a real app, this would likely create a user account
      // For now, we'll just add a profile
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          { 
            id: crypto.randomUUID(), // Generate a random UUID for the profile
            full_name: employee.fullName,
            email: employee.email
          }
        ])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Employee added successfully");
      setIsAddDialogOpen(false);
      setNewEmployee({ fullName: "", email: "", role: "" });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error) => {
      toast.error("Failed to add employee: " + error.message);
    }
  });
  
  const handleAddEmployee = () => {
    if (!newEmployee.fullName) {
      toast.error("Employee name is required");
      return;
    }
    
    addEmployeeMutation.mutate(newEmployee);
  };
  
  // Filter employees based on search
  const filteredEmployees = employees?.filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage your organization's employees</p>
        </div>
        <div className="mt-4 sm:mt-0">
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
        </CardHeader>
        <CardContent>
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
            <div className="rounded-md border">
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
                      <TableCell>{employee.name}</TableCell>
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
                          <Link to={`/employees/${employee.id}`}>
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
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-2">No employees found</p>
              {searchQuery ? (
                <div>
                  <p className="text-muted-foreground mb-4">Try using different search terms</p>
                  <Button variant="outline" onClick={() => setSearchQuery("")}>Clear Search</Button>
                </div>
              ) : (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Enter the details for the new employee.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={newEmployee.fullName}
                onChange={(e) => setNewEmployee({...newEmployee, fullName: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email"
                placeholder="john.doe@company.com"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Input 
                id="role"
                placeholder="Software Engineer"
                value={newEmployee.role}
                onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddEmployee}
              disabled={!newEmployee.fullName || addEmployeeMutation.isPending}
            >
              {addEmployeeMutation.isPending ? "Adding..." : "Add Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
