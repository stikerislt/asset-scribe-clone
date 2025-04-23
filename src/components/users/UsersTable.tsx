
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Mail, Users, ShieldCheck, ShieldX, Crown } from "lucide-react";
import { EnhancedUser } from "@/types/user";
import { UserRoleBadge } from "./UserRoleBadge";
import { UserActionsDropdown } from "./UserActionsDropdown";

interface UsersTableProps {
  users: EnhancedUser[];
  isLoading: boolean;
  onEditUser: (user: EnhancedUser) => void;
  onChangeRole: (user: EnhancedUser) => void;
  showAdminControls: boolean;
  onTransferOwnership?: (user: EnhancedUser) => void;
}

export const UsersTable = ({ 
  users, 
  isLoading, 
  onEditUser, 
  onChangeRole, 
  showAdminControls,
  onTransferOwnership 
}: UsersTableProps) => {
  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="text-center py-8">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (users.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="text-center py-8">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Users className="h-12 w-12 mb-2 text-muted-foreground/50" />
            <p>No users found. Click the Add User button to get started.</p>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">
              <div className="flex items-center space-x-1">
                {user.name}
                {user.isOwner && (
                  <Crown className="h-4 w-4 text-yellow-600 ml-1" title="Organization Owner" />
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                {user.email}
              </div>
            </TableCell>
            <TableCell>
              <UserRoleBadge role={user.dbRole} isOwner={user.isOwner} />
            </TableCell>
            <TableCell>
              {user.active ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100/80">
                  <ShieldX className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <UserActionsDropdown
                user={user}
                onEditClick={onEditUser}
                onRoleClick={onChangeRole}
                showAdminControls={showAdminControls}
                isOwner={user.isOwner}
                onTransferOwnership={onTransferOwnership}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
