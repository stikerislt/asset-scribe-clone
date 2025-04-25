
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
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const getMenuItemsByRole = (role: string) => {
  // Base menu items available to all roles
  const baseMenu = [
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
  ];

  // Additional items for managers and admins
  const managerMenu = [
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

  // Settings only for admins
  const adminMenu = [
    {
      title: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  switch (role) {
    case 'admin':
      return [...baseMenu, ...managerMenu, ...adminMenu];
    case 'manager':
      return [...baseMenu, ...managerMenu];
    default: // user role
      return baseMenu;
  }
};

export function AppSidebar() {
  const { logout, user } = useAuth();

  // Fetch user role
  const { data: userRole = 'user' } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return 'user';
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (error || !data) return 'user';
      return data.role;
    },
  });

  const menuItems = getMenuItemsByRole(userRole);

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
