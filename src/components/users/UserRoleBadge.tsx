
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, Crown } from "lucide-react";
import { UserRole } from "@/lib/api/userRoles";
import { getRoleBadgeProps } from "@/utils/roleUtils";

interface UserRoleBadgeProps {
  role: UserRole | null;
  isOwner?: boolean;
}

export const UserRoleBadge = ({ role, isOwner }: UserRoleBadgeProps) => {
  if (isOwner) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80">
        <Crown className="h-3 w-3 mr-1" />
        Owner
      </Badge>
    );
  }
  
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
