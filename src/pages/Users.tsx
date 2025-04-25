
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UserPlus, Shield, Edit, AlertCircle, Trash } from "lucide-react";
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
import { UserActionButtons } from "@/components/users/UserActionButtons";
import { UserList } from "@/components/users/UserList";
import { UserDialogs } from "@/components/users/UserDialogs";
import { transferTenantOwnership, canDeleteUser } from "@/lib/api/userRoles";
import { UserDeleteDialog } from "@/components/users/UserDeleteDialog";
import { deleteUser } from "@/lib/api/userRoles";

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
  const [isTransferOwnershipDialogOpen, setIsTransferOwnershipDialogOpen] = useState(false);
  const [selectedUserForOwnership, setSelectedUserForOwnership] = useState<EnhancedUser | null>(null);
  const [isTransferringOwnership, setIsTransferringOwnership] = useState(false);
  const [ownerUser, setOwnerUser] = useState<EnhancedUser | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<EnhancedUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
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
      
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('owner_id')
        .eq('id', currentTenant.id)
        .single();
      
      if (tenantError) {
        console.error('Error fetching tenant:', tenantError);
      }
      
      const ownerId = tenantData?.owner_id;
      
      const { data: memberships, error: membershipError } = await supabase
        .from('tenant_memberships')
        .select('user_id, is_owner')
        .eq('tenant_id', currentTenant.id);
        
      if (membershipError) {
        console.error('Error fetching memberships:', membershipError);
      }
      
      const ownershipMap = new Map();
      memberships?.forEach((membership) => {
        if (membership.is_owner) {
          ownershipMap.set(membership.user_id, true);
        }
      });
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', currentTenant.id);
      
      if (profilesError) {
        throw profilesError;
      }
      
      const userIds = profiles.map(profile => profile.id);
      
      // Fix type issue by properly typing the auth.admin.listUsers() response
      interface AuthUser {
        id: string;
        confirmed_at: string | null;
        email_confirmed_at: string | null;
        last_sign_in_at: string | null;
      }
      
      // Fix the type issue with authUsers by explicitly typing it
      const { data: authResponse, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
      }
      
      const authUsersMap = new Map<string, {
        confirmed_at: string | null;
        email_confirmed_at: string | null;
        last_sign_in_at: string | null;
      }>();
      
      // Safely access the users array with proper type checking
      const authUsers = authResponse?.users || [];
      authUsers.forEach((authUser: any) => {
        if (authUser && authUser.id) {
          authUsersMap.set(authUser.id, {
            confirmed_at: authUser.confirmed_at || null,
            email_confirmed_at: authUser.email_confirmed_at || null,
            last_sign_in_at: authUser.last_sign_in_at || null,
          });
        }
      });
      
      const userRolesData = await getAllUserRoles();
      
      const roleMap = new Map();
      userRolesData.forEach((userRole) => {
        roleMap.set(userRole.user_id, userRole.role);
      });
      
      const formattedUsers: EnhancedUser[] = profiles.map(profile => {
        const isOwner = ownershipMap.get(profile.id) || profile.id === ownerId;
        const authUserData = authUsersMap.get(profile.id);
        
        // Explicitly cast the invitationStatus to the union type
        const invitationStatus = authUserData && 
          (authUserData.confirmed_at || authUserData.email_confirmed_at || authUserData.last_sign_in_at) 
            ? 'active' as const : 'pending' as const;
            
        const user: EnhancedUser = {
          id: profile.id,
          name: profile.full_name || 'Unnamed User',
          email: profile.email || 'No email provided',
          role: profile.id === currentUser?.id ? 'Admin' : 'User',
          dbRole: roleMap.get(profile.id) as UserRole || null,
          active: true,
          isOwner: isOwner,
          invitationStatus: invitationStatus
        };
        
        if (isOwner) {
          setOwnerUser(user);
        }
        
        return user;
      });
      
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
      if (!currentTenant) {
        throw new Error("No active tenant selected. Please select a tenant before creating users.");
      }
      
      console.log("Creating user with formValues:", { 
        ...formValues, 
        password: formValues.password ? "[REDACTED]" : undefined 
      });
      
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
        title: "User Invited",
        description: `Sent invitation to ${formValues.name} (${formValues.email}) with ${formValues.role} role`,
        category: 'user',
        icon: <UserPlus className="h-5 w-5 text-green-600" />
      });
      
      toast.success(`User ${formValues.name} invited successfully`);
      
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
        const success = await updateUserRole(selectedUser.id, newRole);
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
        console.error("forceAddCurrentUser: currentUser", currentUser, "currentTenant", currentTenant);
        return;
      }
      
      const { data: tenantMemberships, error: membershipsError } = await supabase
        .from("tenant_memberships")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("tenant_id", currentTenant.id);

      if (membershipsError) {
        toast.error("Could not check memberships");
        console.error("Membership check error", membershipsError);
        return;
      }

      if (!tenantMemberships || tenantMemberships.length === 0) {
        const { error: insertMembershipError } = await supabase
          .from("tenant_memberships")
          .insert({
            user_id: currentUser.id,
            tenant_id: currentTenant.id,
            role: "admin",
            is_primary: true
          });
        
        if (insertMembershipError) {
          toast.error("Failed to add your user to organization");
          console.error("Insert tenant_membership error", insertMembershipError);
          return;
        }
        toast.info("Added you as an admin of this organization.");
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.user_metadata?.full_name || currentUser.email,
          tenant_id: currentTenant.id,
          role: 'admin'
        }, { onConflict: 'id' });

      if (profileError) {
        toast.error("Failed to update user profile");
        console.error("Profile update error", profileError);
        return;
      }

      console.log("Calling edge function to update user role to admin");
      const success = await updateUserRoleByEmail(currentUser.email, 'admin');
      
      if (!success) {
        toast.error("Failed to set user role");
        console.error("Edge function user role update error");
      } else {
        console.log("Edge function successfully updated user role");
      }

      toast.success("Successfully added and configured your user account");
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error adding current user:', error);
      toast.error('Failed to add user to organization');
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedUserForOwnership || !currentTenant) return;
    
    setIsTransferringOwnership(true);
    try {
      const success = await transferTenantOwnership(currentTenant.id, selectedUserForOwnership.id);
      
      if (success) {
        toast.success(`Successfully transferred ownership to ${selectedUserForOwnership.name}`);
        setIsTransferOwnershipDialogOpen(false);
        fetchUsers(); // Refresh the user list
      }
    } catch (error) {
      console.error('Error transferring ownership:', error);
      toast.error('Failed to transfer ownership');
    } finally {
      setIsTransferringOwnership(false);
    }
  };

  const handleOpenTransferOwnershipDialog = (user: EnhancedUser) => {
    setSelectedUserForOwnership(user);
    setIsTransferOwnershipDialogOpen(true);
  };

  const handleOpenDeleteDialog = (user: EnhancedUser) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeletingUser(true);
    
    try {
      const success = await deleteUser(userToDelete.id);
      
      if (success) {
        setUsers(users.filter(u => u.id !== userToDelete.id));
        
        logActivity({
          title: "User Deleted",
          description: `Removed user ${userToDelete.name} from the organization`,
          category: 'user',
          icon: <Trash className="h-5 w-5 text-red-600" />
        });
        
        toast.success(`User ${userToDelete.name} deleted successfully`);
        setIsDeleteDialogOpen(false);
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user: ${error.message}`);
    } finally {
      setIsDeletingUser(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">Manage user accounts and permissions</p>
        </div>
        <UserActionButtons
          onDebug={() => setIsDebugDialogOpen(true)}
          onAddMyUser={forceAddCurrentUser}
          onUpdateRoleByEmail={() => setIsEmailRoleDialogOpen(true)}
          onAddUser={() => setIsAddDialogOpen(true)}
          onTransferOwnership={() => setIsTransferOwnershipDialogOpen(true)}
          showOwnershipButton={isCurrentUserAdmin && !!ownerUser && ownerUser.id === currentUser?.id}
        />
      </div>
      
      <UserList
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        users={filteredUsers}
        isLoading={isLoading}
        onEditUser={handleOpenEditDialog}
        onChangeRole={handleOpenRoleDialog}
        onDeleteUser={handleOpenDeleteDialog}
        showAdminControls={isCurrentUserAdmin}
        onTransferOwnership={handleOpenTransferOwnershipDialog}
      />

      <UserDialogs
        isAddDialogOpen={isAddDialogOpen}
        setIsAddDialogOpen={setIsAddDialogOpen}
        handleAddUser={handleAddUser}
        isCreatingUser={isCreatingUser}
        createUserError={createUserError}
        
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        selectedUser={selectedUser}
        handleEditUser={handleEditUser}
        isUpdatingUser={isUpdatingUser}
        updateUserError={updateUserError}
        editDefaultValues={selectedUser && {
          name: selectedUser.name,
          email: selectedUser.email,
          password: "",
          role: getRoleDisplayName(selectedUser.dbRole),
          active: selectedUser.active
        }}
        
        isRoleDialogOpen={isRoleDialogOpen}
        setIsRoleDialogOpen={setIsRoleDialogOpen}
        selectedRoleUser={selectedUser}
        newRole={newRole}
        setNewRole={setNewRole}
        handleRoleUpdate={handleRoleUpdate}
        isRoleUpdating={isRoleUpdating}
        
        isEmailRoleDialogOpen={isEmailRoleDialogOpen}
        setIsEmailRoleDialogOpen={setIsEmailRoleDialogOpen}
        emailForRoleUpdate={emailForRoleUpdate}
        setEmailForRoleUpdate={setEmailForRoleUpdate}
        roleForEmail={roleForEmail}
        setRoleForEmail={setRoleForEmail}
        handleUpdateRoleByEmail={handleUpdateRoleByEmail}
        
        isDebugDialogOpen={isDebugDialogOpen}
        setIsDebugDialogOpen={setIsDebugDialogOpen}
        debugInfo={debugInfo}
        currentUser={currentUser}
        currentTenant={currentTenant}
        syncUsersToTenant={syncUsersToTenant}
        getRoleDisplayName={getRoleDisplayName}
        
        isTransferOwnershipDialogOpen={isTransferOwnershipDialogOpen}
        setIsTransferOwnershipDialogOpen={setIsTransferOwnershipDialogOpen}
        selectedUserForOwnership={selectedUserForOwnership}
        isTransferringOwnership={isTransferringOwnership}
        handleTransferOwnership={handleTransferOwnership}
      />

      <UserDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteUser}
        user={userToDelete}
        isDeleting={isDeletingUser}
      />

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
