
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  MoreHorizontal, 
  Search, 
  Edit, 
  Trash,
  Users as UsersIcon,
  UserPlus,
  Mail,
  ShieldCheck,
  ShieldX,
  Shield
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserForm, User } from "@/components/UserForm";
import { logUserActivity } from "@/lib/data";
import { useActivity } from "@/hooks/useActivity";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserRole, isAdmin, updateUserRole } from "@/lib/api/userRoles";

// Extended user type to include role from database
interface EnhancedUser extends User {
  dbRole: UserRole | null;
}

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<EnhancedUser | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [isRoleUpdating, setIsRoleUpdating] = useState(false);
  const { logActivity } = useActivity();
  const { user: currentUser } = useAuth();
  
  // Check if current user is an admin
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
  
  // Fetch users from Supabase profiles table
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        
        // Fetch profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
        
        if (profilesError) {
          throw profilesError;
        }
        
        // Get user roles using RPC
        const { data: userRolesData, error: rolesError } = await supabase.rpc('get_all_user_roles');
        
        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
          // Continue anyway, we'll show users without roles
        }
        
        // Create a map of user_id to role
        const roleMap = new Map();
        userRolesData?.forEach((userRole: any) => {
          roleMap.set(userRole.user_id, userRole.role);
        });
        
        // Transform the profiles data to match the EnhancedUser type
        const formattedUsers: EnhancedUser[] = profiles.map(profile => ({
          id: profile.id,
          name: profile.full_name || 'Unnamed User',
          email: profile.email || 'No email provided',
          role: profile.id === currentUser?.id ? 'Admin' : 'User', // UI role
          dbRole: roleMap.get(profile.id) as UserRole || null, // Actual role from database
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

    fetchUsers();
  }, [currentUser]);
  
  const filteredUsers = users.filter(user => 
    user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user?.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddUser = (newUser: User) => {
    // Add the new user to the state
    setUsers(prev => [{...newUser, dbRole: null}, ...prev]);
    
    // Log the activity
    logUserActivity("Created", newUser);
    
    // Close the dialog
    setIsAddDialogOpen(false);
  };
  
  const handleOpenRoleDialog = (user: EnhancedUser) => {
    setSelectedUser(user);
    setNewRole(user.dbRole || 'user');
    setIsRoleDialogOpen(true);
  };
  
  const handleRoleUpdate = async () => {
    if (!selectedUser || !currentUser || !isCurrentUserAdmin) return;
    
    setIsRoleUpdating(true);
    
    try {
      // Update role using our new function
      const success = await updateUserRole(selectedUser.id, newRole);
      
      if (!success) throw new Error("Failed to update role");
      
      // Update local state
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
  
  const getRoleBadge = (user: EnhancedUser) => {
    if (user.dbRole === 'admin') {
      return (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100/80">
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </Badge>
      );
    } else if (user.dbRole === 'manager') {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100/80">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Manager
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100/80">
          <ShieldCheck className="h-3 w-3 mr-1" />
          User
        </Badge>
      );
    }
  };
  
  // Check if the current user is admin to show admin controls
  const showAdminControls = isCurrentUserAdmin;
  
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1">Manage user accounts and permissions</p>
        </div>
        <Button 
          className="mt-4 sm:mt-0" 
          size="sm"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
                        <p className="text-muted-foreground">Loading users...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <UsersIcon className="h-12 w-12 mb-2 text-muted-foreground/50" />
                        <p>No users found. Click the Add User button to get started.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user)}</TableCell>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {showAdminControls && (
                              <DropdownMenuItem onClick={() => handleOpenRoleDialog(user)}>
                                <Shield className="mr-2 h-4 w-4" />
                                Change Role
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <UserForm 
            onSubmit={handleAddUser}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
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
    </div>
  );
};

export default Users;
