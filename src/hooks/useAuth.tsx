
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "@/components/ui/use-toast";
import { useTenant } from "@/hooks/useTenant";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshTenants } = useTenant();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
        if (
          event === "PASSWORD_RECOVERY" ||
          (newSession?.user && (newSession as any).type === 'PASSWORD_RECOVERY')
        ) {
          navigate("/auth/update-password", { replace: true });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
      const hash = window.location.hash;
      if (
        (hash.includes("type=recovery") || hash.includes("type=invite")) &&
        currentSession?.user
      ) {
        navigate("/auth/update-password", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      // Step 1: Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed. Please try again.");

      // Create tenant and membership directly without using RPC
      // Step 2: Create a new tenant for the user
      const tenantName = `${fullName}'s Organization`;
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: tenantName,
          description: 'Default organization',
          owner_id: authData.user.id
        })
        .select()
        .single();
      
      if (tenantError) {
        console.error("Error creating tenant:", tenantError);
        throw new Error(`Failed to create organization: ${tenantError.message}`);
      }

      // Step 3: Create tenant membership with admin role
      if (tenantData) {
        const { error: membershipError } = await supabase
          .from('tenant_memberships')
          .insert({
            tenant_id: tenantData.id,
            user_id: authData.user.id,
            role: 'admin',
            is_primary: true,
            is_owner: true
          });
        
        if (membershipError) {
          console.error("Error creating membership:", membershipError);
          throw new Error(`Failed to create membership: ${membershipError.message}`);
        }

        // Step 4: Create user role record
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'admin'
          });
          
        if (roleError) {
          console.error("Error creating user role:", roleError);
          // Non-blocking error - don't throw
        }
      }

      toast({
        title: "Signup successful",
        description:
          "Your account and organization have been created. You'll receive an email to confirm your registration.",
      });

      navigate("/auth/login");
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/auth/login");
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
