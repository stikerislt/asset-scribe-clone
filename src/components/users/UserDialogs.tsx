
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { UserForm } from "@/components/UserForm";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Shield } from "lucide-react";
import { UserRole } from "@/lib/api/userRoles";
import { TransferOwnershipDialog } from "./TransferOwnershipDialog";

interface UserDialogsProps {
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (open: boolean) => void;
  handleAddUser: (fv: any) => void;
  isCreatingUser: boolean;
  createUserError?: string;
  
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  selectedUser: any;
  handleEditUser: (fv: any) => void;
  isUpdatingUser: boolean;
  updateUserError?: string;
  editDefaultValues: any;
  
  isRoleDialogOpen: boolean;
  setIsRoleDialogOpen: (open: boolean) => void;
  selectedRoleUser: any;
  newRole: UserRole;
  setNewRole: (r: UserRole) => void;
  handleRoleUpdate: () => void;
  isRoleUpdating: boolean;
  
  isEmailRoleDialogOpen: boolean;
  setIsEmailRoleDialogOpen: (open: boolean) => void;
  emailForRoleUpdate: string;
  setEmailForRoleUpdate: (v: string) => void;
  roleForEmail: UserRole;
  setRoleForEmail: (r: UserRole) => void;
  handleUpdateRoleByEmail: () => void;
  
  isDebugDialogOpen: boolean;
  setIsDebugDialogOpen: (open: boolean) => void;
  debugInfo: any;
  currentUser: any;
  currentTenant: any;
  syncUsersToTenant: () => void;
  getRoleDisplayName: (role: UserRole | null) => string;
  
  isTransferOwnershipDialogOpen: boolean;
  setIsTransferOwnershipDialogOpen: (open: boolean) => void;
  selectedUserForOwnership: any;
  isTransferringOwnership: boolean;
  handleTransferOwnership: () => void;
}

export function UserDialogs({
  isAddDialogOpen, setIsAddDialogOpen, handleAddUser, isCreatingUser, createUserError,
  isEditDialogOpen, setIsEditDialogOpen, selectedUser, handleEditUser,
  isUpdatingUser, updateUserError, editDefaultValues,
  isRoleDialogOpen, setIsRoleDialogOpen, selectedRoleUser, newRole, setNewRole, handleRoleUpdate, isRoleUpdating,
  isEmailRoleDialogOpen, setIsEmailRoleDialogOpen, emailForRoleUpdate, setEmailForRoleUpdate, roleForEmail, setRoleForEmail, handleUpdateRoleByEmail,
  isDebugDialogOpen, setIsDebugDialogOpen, debugInfo, currentUser, currentTenant,
  syncUsersToTenant, getRoleDisplayName,
  isTransferOwnershipDialogOpen,
  setIsTransferOwnershipDialogOpen,
  selectedUserForOwnership,
  isTransferringOwnership,
  handleTransferOwnership
}: UserDialogsProps) {
  return (
    <>
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <UserForm 
            onSubmit={handleAddUser}
            onCancel={() => setIsAddDialogOpen(false)}
            isSubmitting={isCreatingUser}
            error={createUserError}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              {selectedUser && `Update information for ${selectedUser.name}`}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserForm 
              onSubmit={handleEditUser}
              onCancel={() => setIsEditDialogOpen(false)}
              isSubmitting={isUpdatingUser}
              error={updateUserError}
              defaultValues={editDefaultValues}
              isEditMode={true}
            />
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              {selectedRoleUser && `Update role for ${selectedRoleUser.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">Select Role</label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleUpdate} disabled={isRoleUpdating}>
              {isRoleUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEmailRoleDialogOpen} onOpenChange={setIsEmailRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role by Email</DialogTitle>
            <DialogDescription>
              Enter the user's email address and select the new role to assign
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="emailForRole" className="text-sm font-medium">Email Address</label>
              <Input 
                id="emailForRole"
                placeholder="user@example.com"
                value={emailForRoleUpdate}
                onChange={(e) => setEmailForRoleUpdate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="roleForEmail" className="text-sm font-medium">Select Role</label>
              <Select value={roleForEmail} onValueChange={(value) => setRoleForEmail(value as UserRole)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRoleByEmail} disabled={isRoleUpdating || !emailForRoleUpdate}>
              {isRoleUpdating ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <TransferOwnershipDialog
        isOpen={isTransferOwnershipDialogOpen}
        onClose={() => setIsTransferOwnershipDialogOpen(false)}
        onConfirm={handleTransferOwnership}
        selectedUser={selectedUserForOwnership}
        isTransferring={isTransferringOwnership}
      />
    </>
  );
}
