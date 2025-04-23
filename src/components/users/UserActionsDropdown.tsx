import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Shield, Trash } from "lucide-react";
import { EnhancedUser } from "@/types/user";

interface UserActionsDropdownProps {
  user: EnhancedUser;
  onEditClick: (user: EnhancedUser) => void;
  onRoleClick: (user: EnhancedUser) => void;
  showAdminControls: boolean;
  isOwner?: boolean;
  disabled?: boolean;
}

export const UserActionsDropdown = ({ 
  user, 
  onEditClick, 
  onRoleClick, 
  showAdminControls,
  isOwner = false,
  disabled = false
}: UserActionsDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={disabled}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          Actions
          {isOwner && (
            <span className="ml-2 text-xs text-yellow-600">(Owner)</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => onEditClick(user)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        {showAdminControls && (
          <DropdownMenuItem onClick={() => onRoleClick(user)}>
            <Shield className="mr-2 h-4 w-4" />
            Change Role
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-red-600" 
          disabled={isOwner}
          onClick={() => {
            if (!isOwner) {
              // Keep existing delete logic
            }
          }}
        >
          <Trash className="mr-2 h-4 w-4" />
          {isOwner ? "Cannot delete owner" : "Delete"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
