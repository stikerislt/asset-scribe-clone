import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User, AuthChangeEvent } from "@supabase/supabase-js";
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: keyof typeof AuthChangeEvent, newSession) => {
        console.log("Auth state change:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' || event === 'SIGNED_UP') {
          localStorage.removeItem('pendingVerificationEmail');
          localStorage.removeItem('activities');
          
          const params = new URLSearchParams(window.location.hash);
          if (params.get("type") === "recovery" || params.get("type") === "signup") {
            toast.success("Email verified successfully!");
            navigate("/onboarding");
          } else {
            try {
              const { data, error } = await supabase.rpc('has_completed_onboarding', {
                user_id: newSession?.user?.id
              });

              if (error) {
                console.error("Error checking onboarding status:", error);
                toast.error("Failed to check onboarding status");
              }

              if (!data && newSession?.user) {
                console.log("User has not completed onboarding, redirecting...");
                navigate("/onboarding");
              } else {
                navigate("/dashboard");
              }
            } catch (error) {
              console.error("Error checking onboarding status:", error);
              toast.error("Failed to check onboarding status");
            }
          }
        }

        if (event === 'PASSWORD_RECOVERY') {
          navigate("/auth/update-password", { replace: true });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      localStorage.removeItem('activities');
      
      toast.success("Login successful");
      
      const { data, error: checkError } = await supabase.rpc('has_completed_onboarding', {
        user_id: (await supabase.auth.getUser()).data.user?.id
      });
      
      if (checkError) {
        console.error("Error checking onboarding status:", checkError);
      }
      
      navigate(data ? "/dashboard" : "/onboarding");
    } catch (error: any) {
      toast.error("Login failed: " + error.message);
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      localStorage.setItem('pendingVerificationEmail', email);
      
      localStorage.removeItem('activities');
      
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

      toast.success("Success! Please check your email to verify your account.");
      toast("Verification email sent", {
        description: `We've sent a verification link to ${email}. Please check your inbox and spam folder.`,
        duration: 6000,
      });

      navigate("/auth/login");
    } catch (error: any) {
      localStorage.removeItem('pendingVerificationEmail');
      toast.error("Signup failed: " + error.message);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout failed: " + error.message);
      return;
    }
    
    localStorage.removeItem('activities');
    
    toast.success("Logged out successfully");
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
