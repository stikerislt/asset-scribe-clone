
import { Button } from "@/components/ui/button";
import { UserPlus, Shield, AlertCircle } from "lucide-react";

interface UserActionButtonsProps {
  onDebug: () => void;
  onAddMyUser: () => void;
  onUpdateRoleByEmail: () => void;
  onAddUser: () => void;
}

export function UserActionButtons({
  onDebug,
  onAddMyUser,
  onUpdateRoleByEmail,
  onAddUser,
}: UserActionButtonsProps) {
  return (
    <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
      <Button 
        variant="outline"
        onClick={onDebug}
        className="bg-amber-50 text-amber-800"
      >
        <AlertCircle className="mr-2 h-4 w-4" />
        Debug Users
      </Button>
      <Button 
        variant="outline"
        onClick={onAddMyUser}
        className="bg-blue-50 text-blue-800"
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Add My User
      </Button>
      <Button 
        className="bg-purple-600 hover:bg-purple-700"
        onClick={onUpdateRoleByEmail}
      >
        <Shield className="mr-2 h-4 w-4" />
        Update Role By Email
      </Button>
      <Button 
        size="sm"
        onClick={onAddUser}
      >
        <UserPlus className="mr-2 h-4 w-4" />
        Add User
      </Button>
    </div>
  );
}
