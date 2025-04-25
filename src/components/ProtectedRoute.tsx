import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'user';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const { data: userAccess, isLoading: accessLoading } = useQuery({
    queryKey: ['user-access', user?.id],
    queryFn: async () => {
      if (!user?.id) return { role: 'user', isOwner: false };
      
      // Check if the user is an owner of any tenant
      const { data: ownerData, error: ownerError } = await supabase
        .from('tenant_memberships')
        .select('is_owner')
        .eq('user_id', user.id)
        .eq('is_owner', true)
        .single();
          
      // If the user is an owner, they have admin access
      if (!ownerError && ownerData && ownerData.is_owner) {
        return { role: 'admin', isOwner: true };
      }
      
      // Otherwise, check their role from user_roles table
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (error || !data) {
        return { role: 'user', isOwner: false };
      }
      
      return { role: data.role, isOwner: false };
    },
    enabled: !!user
  });

  if (loading || accessLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole) {
    const hasAccess = (() => {
      // Tenant owners always have access to everything (admin level)
      if (userAccess?.isOwner) {
        return true;
      }
      
      const role = userAccess?.role || 'user';
      
      switch (requiredRole) {
        case 'admin':
          return role === 'admin';
        case 'manager':
          return role === 'admin' || role === 'manager';
        case 'user':
          return true; // all authenticated users can access user-level routes
        default:
          return false;
      }
    })();

    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
