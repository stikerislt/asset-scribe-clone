
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserSearch } from "@/components/users/UserSearch";
import { UsersTable } from "@/components/users/UsersTable";
import { EnhancedUser } from "@/types/user";

interface UserListProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  users: EnhancedUser[];
  isLoading: boolean;
  onEditUser: (user: EnhancedUser) => void;
  onChangeRole: (user: EnhancedUser) => void;
  showAdminControls: boolean;
  onTransferOwnership?: (user: EnhancedUser) => void;
}

export function UserList({
  searchTerm,
  onSearchChange,
  users,
  isLoading,
  onEditUser,
  onChangeRole,
  showAdminControls,
  onTransferOwnership
}: UserListProps) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>User Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <UserSearch value={searchTerm} onChange={onSearchChange} />
        </div>
        <div className="overflow-x-auto">
          <UsersTable
            users={users}
            isLoading={isLoading}
            onEditUser={onEditUser}
            onChangeRole={onChangeRole}
            showAdminControls={showAdminControls}
            onTransferOwnership={onTransferOwnership}
          />
        </div>
      </CardContent>
    </Card>
  );
}
