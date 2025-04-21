
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck } from "lucide-react";
import { UserRole } from "@/lib/api/userRoles";
import { getRoleBadgeProps } from "@/utils/roleUtils";

interface UserRoleBadgeProps {
  role: UserRole | null;
}

export const UserRoleBadge = ({ role }: UserRoleBadgeProps) => {
  const { className, icon, label } = getRoleBadgeProps(role);
  
  return (
    <Badge className={className}>
      {icon === "shield" ? (
        <Shield className="h-3 w-3 mr-1" />
      ) : (
        <ShieldCheck className="h-3 w-3 mr-1" />
      )}
      {label}
    </Badge>
  );
};
