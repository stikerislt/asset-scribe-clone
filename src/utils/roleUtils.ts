
import { UserRole } from "@/lib/api/userRoles";

export const getRoleDisplayName = (dbRole: UserRole | null): "Admin" | "Manager" | "User" => {
  if (!dbRole) return "User";
  return dbRole.charAt(0).toUpperCase() + dbRole.slice(1) as "Admin" | "Manager" | "User";
};

export const getRoleBadgeProps = (role: UserRole | null) => {
  switch (role) {
    case 'admin':
      return {
        className: "bg-purple-100 text-purple-800 hover:bg-purple-100/80",
        icon: "shield",
        label: "Admin"
      };
    case 'manager':
      return {
        className: "bg-blue-100 text-blue-800 hover:bg-blue-100/80",
        icon: "shield-check",
        label: "Manager"
      };
    default:
      return {
        className: "bg-gray-100 text-gray-800 hover:bg-gray-100/80",
        icon: "shield-check",
        label: "User"
      };
  }
};
