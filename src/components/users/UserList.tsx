
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EnhancedUser } from "@/types/user";
import { UsersTable } from "./UsersTable";
import { Loader2, Search } from "lucide-react";

interface UserListProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  users: EnhancedUser[];
  isLoading: boolean;
  onChangeRole: (user: EnhancedUser) => void;
  onEditUser: (user: EnhancedUser) => void;
  showAdminControls: boolean;
  onTransferOwnership: (user: EnhancedUser) => void;
}

export function UserList({
  searchTerm,
  onSearchChange,
  users,
  isLoading,
  onChangeRole,
  onEditUser,
  showAdminControls,
  onTransferOwnership
}: UserListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Members</CardTitle>
        <CardDescription>
          Manage your organization's members and their access levels. New users will receive an invitation email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : users.length > 0 ? (
          <UsersTable 
            users={users} 
            isLoading={isLoading}  // Add this line to pass isLoading prop
            onChangeRole={onChangeRole} 
            onEditUser={onEditUser} 
            showAdminControls={showAdminControls}
            onTransferOwnership={onTransferOwnership}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No users found. Try changing your search or invite some team members.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
