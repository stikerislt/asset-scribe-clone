
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addEmployee } from "@/lib/api/employees";

interface AddEmployeeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddEmployeeDialog = ({ isOpen, onOpenChange }: AddEmployeeDialogProps) => {
  const [newEmployee, setNewEmployee] = useState({
    fullName: "",
    email: "",
    role: "",
    department: "",
    hire_date: ""
  });
  
  const queryClient = useQueryClient();

  const addEmployeeMutation = useMutation({
    mutationFn: addEmployee,
    onSuccess: () => {
      toast.success("Employee added successfully");
      onOpenChange(false);
      setNewEmployee({ fullName: "", email: "", role: "", department: "", hire_date: "" });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: Error) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
          <div className="grid gap-2">
            <Label htmlFor="department">Department</Label>
            <Input 
              id="department"
              placeholder="Engineering"
              value={newEmployee.department}
              onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hire_date">Hire Date</Label>
            <Input 
              id="hire_date"
              type="date"
              value={newEmployee.hire_date}
              onChange={(e) => setNewEmployee({...newEmployee, hire_date: e.target.value})}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleAddEmployee}
            disabled={!newEmployee.fullName || addEmployeeMutation.isPending}
          >
            {addEmployeeMutation.isPending ? "Adding..." : "Add Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
