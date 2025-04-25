
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

  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return 'user';
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (error || !data) {
        // Check if the user is an owner of any tenant
        const { data: ownerData, error: ownerError } = await supabase
          .from('tenant_memberships')
          .select('is_owner')
          .eq('user_id', user.id)
          .eq('is_owner', true)
          .single();
          
        // If the user is an owner, give them admin role by default
        if (!ownerError && ownerData && ownerData.is_owner) {
          return 'admin';
        }
        
        return 'user';
      }
      return data.role;
    },
    enabled: !!user
  });

  if (loading || roleLoading) {
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
      switch (requiredRole) {
        case 'admin':
          return userRole === 'admin';
        case 'manager':
          return userRole === 'admin' || userRole === 'manager';
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
