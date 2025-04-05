
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Briefcase, Package } from "lucide-react";

interface EmployeeProfileCardProps {
  employee: {
    name: string;
    role?: string;
    email?: string;
    avatar?: string;
  };
  assetsCount: number;
}

export function EmployeeProfileCard({ employee, assetsCount }: EmployeeProfileCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
    <Card>
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
            <span>{assetsCount || 0} assigned assets</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
