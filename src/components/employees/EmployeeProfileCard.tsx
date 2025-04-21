
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Mail, User, PackagePlus, Calendar } from "lucide-react";
import { Employee } from "@/lib/api/employees";
import { formatDate } from "@/lib/utils";

interface EmployeeProfileCardProps {
  employee: Employee;
  assetsCount: number;
}

export const EmployeeProfileCard = ({ employee, assetsCount }: EmployeeProfileCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{employee.name}</span>
        </div>
        
        {employee.email && (
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{employee.email}</span>
          </div>
        )}
        
        {employee.role && (
          <div className="flex items-center space-x-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span>{employee.role}</span>
          </div>
        )}

        {employee.department && (
          <div className="flex items-center space-x-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span>Department: {employee.department}</span>
          </div>
        )}

        {employee.hire_date && (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Hired: {formatDate(new Date(employee.hire_date))}</span>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <PackagePlus className="h-4 w-4 text-muted-foreground" />
          <span>{assetsCount} {assetsCount === 1 ? 'Asset' : 'Assets'} Assigned</span>
        </div>
      </CardContent>
    </Card>
  );
};
