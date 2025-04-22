import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UserPlus, Shield, Edit, AlertCircle } from "lucide-react";
import { UserForm } from "@/components/UserForm";
import { useActivity } from "@/hooks/useActivity";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserRole, isAdmin, updateUserRole, updateUserRoleByEmail, getAllUserRoles, createUser } from "@/lib/api/userRoles";
import { EnhancedUser } from "@/types/user";
import { UserSearch } from "@/components/users/UserSearch";
import { UsersTable } from "@/components/users/UsersTable";
import { getRoleDisplayName } from "@/utils/roleUtils";
import { useTenant } from "@/hooks/useTenant";

const Users = () => {
  const { currentTenant } = useTenant();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<EnhancedUser | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [isRoleUpdating, setIsRoleUpdating] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | undefined>();
  const [isEmailRoleDialogOpen, setIsEmailRoleDialogOpen] = useState(false);
  const [emailForRoleUpdate, setEmailForRoleUpdate] = useState("");
  const [roleForEmail, setRoleForEmail] = useState<UserRole>("admin");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [updateUserError, setUpdateUserError] = useState<string | undefined>();
  const [isDebugDialogOpen, setIsDebugDialogOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { logActivity } = useActivity();
  const { user: currentUser } = useAuth();
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser) {
        const isAdminResult = await isAdmin(currentUser.id);
        setIsCurrentUserAdmin(isAdminResult);
      }
    };
    
    checkAdminStatus();
  }, [currentUser]);

  useEffect(() => {
    const updateLicencijosRole = async () => {
      try {
        console.log("Attempting to update licencijos@govilnius.lt to admin role");
        const result = await updateUserRoleByEmail('licencijos@govilnius.lt', 'admin');
        if (result) {
          toast.success('Successfully updated licencijos@govilnius.lt to admin role');
          fetchUsers(); // Refresh the user list
        }
      } catch (error) {
        console.error('Error updating user role:', error);
      }
    };
    
    updateLicencijosRole();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      if (!currentTenant) {
        setUsers([]);
        return;
      }
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', currentTenant.id);
      
      if (profilesError) {
        throw profilesError;
      }
      
      const userRolesData = await getAllUserRoles();
      
      const roleMap = new Map();
      userRolesData.forEach((userRole) => {
        roleMap.set(userRole.user_id, userRole.role);
      });
      
      const formattedUsers: EnhancedUser[] = profiles.map(profile => ({
        id: profile.id,
        name: profile.full_name || 'Unnamed User',
        email: profile.email || 'No email provided',
        role: profile.id === currentUser?.id ? 'Admin' : 'User',
        dbRole: roleMap.get(profile.id) as UserRole || null,
        active: true
      }));
      
      setUsers(formattedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser, currentTenant]);

  const filteredUsers = users.filter(user => 
    user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user?.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = async (formValues: any) => {
    setIsCreatingUser(true);
    setCreateUserError(undefined);
    
    try {
      const dbRole = formValues.role.toLowerCase() as UserRole;
      
      const result = await createUser(
        formValues.email,
        formValues.password,
        formValues.name,
        dbRole,
        formValues.active
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create user');
      }
      
      logActivity({
        title: "User Created",
        description: `Created user account for ${formValues.name}`,
        category: 'user',
        icon: <UserPlus className="h-5 w-5 text-green-600" />
      });
      
      toast.success(`User ${formValues.name} created successfully`);
      
      setIsAddDialogOpen(false);
      fetchUsers();
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      setCreateUserError(error.message);
      toast.error(`Failed to create user: ${error.message}`);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleOpenRoleDialog = (user: EnhancedUser) => {
    setSelectedUser(user);
    setNewRole(user.dbRole || 'user');
    setIsRoleDialogOpen(true);
  };

  const handleOpenEditDialog = (user: EnhancedUser) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleEditUser = async (formValues: any) => {
    if (!selectedUser) return;
    
    setIsUpdatingUser(true);
    setUpdateUserError(undefined);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formValues.name,
          email: formValues.email
        })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      const newDbRole = formValues.role.toLowerCase() as UserRole;
      if (selectedUser.dbRole !== newDbRole) {
        const success = await updateUserRole(selectedUser.id, newDbRole);
        if (!success) throw new Error("Failed to update role");
      }
      
      logActivity({
        title: "User Updated",
        description: `Updated ${formValues.name}'s account information`,
        category: 'user',
        icon: <Edit className="h-5 w-5 text-blue-600" />
      });
      
      toast.success(`User ${formValues.name} updated successfully`);
      
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id 
          ? { 
              ...user, 
              name: formValues.name, 
              email: formValues.email, 
              dbRole: newDbRole, 
              active: formValues.active 
            } 
          : user
      ));
      
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating user:', error);
      setUpdateUserError(error.message);
      toast.error(`Failed to update user: ${error.message}`);
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser || !currentUser || !isCurrentUserAdmin) return;
    
    setIsRoleUpdating(true);
    
    try {
      const success = await updateUserRole(selectedUser.id, newRole);
      
      if (!success) throw new Error("Failed to update role");
      
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id 
          ? { ...user, dbRole: newRole } 
          : user
      ));
      
      toast.success(`${selectedUser.name}'s role updated to ${newRole}`);
      
      logActivity({
        title: "User Role Updated",
        description: `Changed ${selectedUser.name}'s role to ${newRole}`,
        category: 'user',
        icon: <Shield className="h-5 w-5 text-blue-600" />
      });
      
      setIsRoleDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(`Failed to update role: ${error.message}`);
    } finally {
      setIsRoleUpdating(false);
    }
  };

  const handleUpdateRoleByEmail = async () => {
    if (!emailForRoleUpdate || !roleForEmail) return;
    
    setIsRoleUpdating(true);
    
    try {
      console.log(`Attempting to update ${emailForRoleUpdate} to ${roleForEmail} role`);
      
      const success = await updateUserRoleByEmail(emailForRoleUpdate, roleForEmail);
      
      if (!success) throw new Error("Failed to update role");
      
      toast.success(`User ${emailForRoleUpdate}'s role updated to ${roleForEmail}`);
      
      logActivity({
        title: "User Role Updated by Email",
        description: `Changed ${emailForRoleUpdate}'s role to ${roleForEmail}`,
        category: 'user',
        icon: <Shield className="h-5 w-5 text-blue-600" />
      });
      
      setIsEmailRoleDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role by email:', error);
      toast.error(`Failed to update role: ${error.message}`);
    } finally {
      setIsRoleUpdating(false);
    }
  };

  const syncUsersToTenant = async () => {
    if (!currentTenant) return;
    
    try {
      const { data: session } = await supabase.auth.getSession();
      const currentAuthUser = session?.session?.user;
      
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching user roles for sync:', rolesError);
        toast.error('Failed to sync user roles');
        return;
      }

      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, tenant_id');

      if (profilesError) {
        console.error('Error fetching all profiles for sync:', profilesError);
        toast.error('Failed to sync profiles');
        return;
      }

      const { data: tenantProfiles, error: tenantProfilesError } = await supabase
        .from('profiles')
        .select('id')
        .eq('tenant_id', currentTenant.id);

      if (tenantProfilesError) {
        console.error('Error fetching tenant profiles for sync:', tenantProfilesError);
        toast.error('Failed to sync profiles');
        return;
      }

      const existingProfileIds = new Set(tenantProfiles?.map(p => p.id) || []);
      
      const profilesById = new Map();
      allProfiles?.forEach(profile => {
        profilesById.set(profile.id, profile);
      });
      
      const userIds = userRoles?.map(ur => ur.user_id) || [];
      
      if (currentAuthUser && !userIds.includes(currentAuthUser.id)) {
        userIds.push(currentAuthUser.id);
      }

      const debugData = {
        currentUser: currentAuthUser,
        currentTenant,
        userRoles,
        allProfiles,
        tenantProfiles,
        existingProfileIds: Array.from(existingProfileIds),
        userIds
      };
      setDebugInfo(debugData);

      let added = 0;
      for (const userId of userIds) {
        if (!existingProfileIds.has(userId)) {
          const existingProfile = profilesById.get(userId);
          
          await supabase.from('profiles').insert({
            id: userId,
            email: existingProfile?.email || (userId === currentAuthUser?.id ? currentAuthUser.email : ""),
            full_name: existingProfile?.full_name || "",
            tenant_id: currentTenant.id,
          });
          
          added++;
        }
      }
      
      if (added > 0) {
        toast.info(`Added ${added} missing users to the organization.`);
        fetchUsers(); // Refresh the user list
      }
      
      if (currentAuthUser) {
        const currentUserInTenant = existingProfileIds.has(currentAuthUser.id);
        if (!currentUserInTenant) {
          await supabase.from('profiles').upsert({
            id: currentAuthUser.id,
            email: currentAuthUser.email,
            tenant_id: currentTenant.id
          }, { onConflict: 'id' });
          
          toast.info("Added your user profile to the current organization.");
          fetchUsers(); // Refresh the list
        }
      }
      
    } catch (error) {
      console.error('Error syncing users to tenant:', error);
      toast.error('Failed to sync users to organization');
    }
  };

  useEffect(() => {
    syncUsersToTenant();
    // eslint-disable-next-line
  }, [currentTenant]);

  const forceAddCurrentUser = async () => {
    try {
      if (!currentUser || !currentTenant) {
        toast.error("No current user or tenant found");
        return;
      }
      
      await supabase.from('profiles').upsert({
        id: currentUser.id,
        email: currentUser.email,
        tenant_id: currentTenant.id
      }, { onConflict: 'id' });
      
      toast.success("Successfully added your user to this organization");
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error adding current user:', error);
      toast.error('Failed to add user to organization');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">Manage user accounts and permissions</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsDebugDialogOpen(true)}
            className="bg-amber-50 text-amber-800"
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            Debug Users
          </Button>
          <Button 
            variant="outline"
            onClick={forceAddCurrentUser}
            className="bg-blue-50 text-blue-800"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add My User
          </Button>
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => setIsEmailRoleDialogOpen(true)}
          >
            <Shield className="mr-2 h-4 w-4" />
            Update Role By Email
          </Button>
          <Button 
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <UserSearch value={searchTerm} onChange={setSearchTerm} />
          </div>
          
          <div className="overflow-x-auto">
            <UsersTable
              users={filteredUsers}
              isLoading={isLoading}
              onEditUser={handleOpenEditDialog}
              onChangeRole={handleOpenRoleDialog}
              showAdminControls={isCurrentUserAdmin}
            />
          </div>
        </CardContent>
      </Card>

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
              defaultValues={{
                name: selectedUser.name,
                email: selectedUser.email,
                password: "",
                role: getRoleDisplayName(selectedUser.dbRole),
                active: selectedUser.active
              }}
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
              {selectedUser && `Update role for ${selectedUser.name}`}
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

      <Dialog open={isDebugDialogOpen} onOpenChange={setIsDebugDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>User Debug Information</DialogTitle>
            <DialogDescription>
              Troubleshooting information for user visibility issues
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Current User</h3>
              <pre className="bg-slate-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(currentUser, null, 2)}
              </pre>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Current Tenant</h3>
              <pre className="bg-slate-100 p-2 rounded text-sm overflow-auto">
                {JSON.stringify(currentTenant, null, 2)}
              </pre>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Sync Debug Data</h3>
              <pre className="bg-slate-100 p-2 rounded text-sm overflow-auto">
                {debugInfo ? JSON.stringify(debugInfo, null, 2) : "No sync data available"}
              </pre>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => syncUsersToTenant()}>
              Run Sync Again
            </Button>
            <Button variant="outline" onClick={() => setIsDebugDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
