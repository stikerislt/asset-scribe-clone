
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

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

  useEffect(() => {
    console.log("[AuthProvider] Setting up auth state listener");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("[AuthProvider] Auth state change:", event, newSession?.user?.id);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          localStorage.removeItem('pendingVerificationEmail');
          localStorage.removeItem('activities');
          
          const params = new URLSearchParams(window.location.hash);
          if (params.get("type") === "recovery" || params.get("type") === "signup") {
            toast.success("Email verified successfully!");
            navigate("/onboarding");
          } else {
            try {
              console.log("[AuthProvider] Checking onboarding status for user:", newSession?.user?.id);
              const { data, error } = await supabase.rpc('has_completed_onboarding', {
                user_id: newSession?.user?.id
              });
              
              if (error) {
                console.error("[AuthProvider] Error checking onboarding status:", error);
                toast.error("Failed to check onboarding status");
                return;
              }

              console.log("[AuthProvider] Onboarding status:", data);
              const redirectPath = data ? "/dashboard" : "/onboarding";
              console.log("[AuthProvider] Redirecting to:", redirectPath);
              navigate(redirectPath);
            } catch (error) {
              console.error("[AuthProvider] Error checking onboarding status:", error);
              toast.error("Failed to check onboarding status");
            }
          }
        }

        if (event === 'PASSWORD_RECOVERY') {
          navigate("/auth/update-password", { replace: true });
        }
      }
    );

    console.log("[AuthProvider] Checking for existing session");
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("[AuthProvider] Existing session:", currentSession?.user?.id);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const login = async (email: string, password: string) => {
    try {
      console.log("[AuthProvider] Attempting login for:", email);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      localStorage.removeItem('activities');
      
      toast.success("Login successful");
      
      console.log("[AuthProvider] Login successful, checking onboarding status");
      const { data, error: checkError } = await supabase.rpc('has_completed_onboarding', {
        user_id: (await supabase.auth.getUser()).data.user?.id
      });
      
      if (checkError) {
        console.error("[AuthProvider] Error checking onboarding status:", checkError);
      }
      
      const redirectPath = data ? "/dashboard" : "/onboarding";
      console.log("[AuthProvider] Redirecting to:", redirectPath);
      navigate(redirectPath);
    } catch (error: any) {
      console.error("[AuthProvider] Login error:", error);
      toast.error("Login failed: " + error.message);
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      localStorage.setItem('pendingVerificationEmail', email);
      
      localStorage.removeItem('activities');
      
      console.log("[AuthProvider] Attempting signup for:", email);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: window.location.origin + '/auth/login'
        }
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed. Please try again.");

      console.log("[AuthProvider] Signup successful");
      toast.success("Success! Please check your email to verify your account.");
      toast("Verification email sent", {
        description: `We've sent a verification link to ${email}. Please check your inbox and spam folder.`,
        duration: 6000,
      });

      navigate("/auth/login");
    } catch (error: any) {
      console.error("[AuthProvider] Signup error:", error);
      localStorage.removeItem('pendingVerificationEmail');
      toast.error("Signup failed: " + error.message);
    }
  };

  const logout = async () => {
    try {
      console.log("[AuthProvider] Logging out user");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[AuthProvider] Logout error:", error);
        toast.error("Logout failed: " + error.message);
        return;
      }
      
      localStorage.removeItem('activities');
      
      toast.success("Logged out successfully");
      navigate("/auth/login");
    } catch (error) {
      console.error("[AuthProvider] Logout error:", error);
      toast.error("Logout failed. Please try again.");
    }
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
