
import { UserRole } from "@/lib/api/userRoles";
import { User } from "@/components/UserForm";

export interface EnhancedUser extends User {
  dbRole: UserRole | null;
}
