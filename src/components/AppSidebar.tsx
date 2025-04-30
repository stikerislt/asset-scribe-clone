
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Tag, 
  Settings, 
  LogOut,
  BarChart3,
  Shield,
  Warehouse
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const getMenuItemsByRole = (role: string, isOwner: boolean) => {
  // If the user is an owner, they should have admin access regardless of their role
  if (isOwner) {
    return getAdminMenuItems();
  }
  
  switch (role) {
    case 'admin':
      return getAdminMenuItems();
    case 'manager':
      return getManagerMenuItems();
    default: // user role
      return getUserMenuItems();
  }
};

// Base menu items available to all roles
const getUserMenuItems = () => [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Assets",
    path: "/assets",
    icon: Package,
  },
  {
    title: "Warehouse",
    path: "/warehouse",
    icon: Warehouse,
  },
];

// Additional items for managers
const getManagerMenuItems = () => [
  ...getUserMenuItems(),
  {
    title: "Employees",
    path: "/employees",
    icon: Users,
  },
  {
    title: "Categories",
    path: "/categories",
    icon: Tag,
  },
  {
    title: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Users",
    path: "/users",
    icon: Shield,
  },
];

// All items for admins and owners
const getAdminMenuItems = () => [
  ...getManagerMenuItems(),
  {
    title: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { logout, user } = useAuth();

  // Fetch user role and owner status
  const { data: userInfo = { role: 'user', isOwner: false } } = useQuery({
    queryKey: ['user-info', user?.id],
    queryFn: async () => {
      if (!user?.id) return { role: 'user', isOwner: false };
      
      // Get user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      // Check if user is a tenant owner
      const { data: ownerData, error: ownerError } = await supabase
        .from('tenant_memberships')
        .select('is_owner')
        .eq('user_id', user.id)
        .eq('is_owner', true)
        .single();
      
      const isOwner = !ownerError && ownerData && ownerData.is_owner === true;
      const role = roleError || !roleData ? 'user' : roleData.role;
      
      return { role, isOwner };
    },
  });

  const menuItems = getMenuItemsByRole(userInfo.role, userInfo.isOwner);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="py-6 px-3 flex justify-center">
        <h1 className="text-2xl font-bold text-white">ekspeer.com Inventory</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.path}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="mt-auto p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="w-full" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
