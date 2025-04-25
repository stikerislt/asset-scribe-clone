
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state change:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        if (event === "SIGNED_IN") {
          // Check if this is right after email verification
          const params = new URLSearchParams(window.location.hash);
          if (params.get("type") === "recovery" || params.get("type") === "signup") {
            toast.success("Email verified successfully! You can now log in.");
            navigate("/auth/login");
          }
        }

        if (
          event === "PASSWORD_RECOVERY" ||
          (newSession?.user && (newSession as any).type === 'PASSWORD_RECOVERY')
        ) {
          navigate("/auth/update-password", { replace: true });
        }
      }
    );

    // Initial session check
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
      
      toast.success("Login successful");
      
      // Check if user has completed onboarding
      const { data, error: checkError } = await supabase.rpc('has_completed_onboarding', {
        user_id: (await supabase.auth.getUser()).data.user?.id
      });
      
      if (checkError) {
        console.error("Error checking onboarding status:", checkError);
      }
      
      // Navigate based on onboarding status
      navigate(data ? "/dashboard" : "/onboarding");
    } catch (error: any) {
      toast.error("Login failed: " + error.message);
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    try {
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

      toast.success(
        "Success! Please check your email to verify your account."
      );

      // Show a more detailed message with the email address
      toast("Verification email sent", {
        description: `We've sent a verification link to ${email}. Please check your inbox and spam folder.`,
        duration: 6000,
      });

      navigate("/auth/login");
    } catch (error: any) {
      toast.error("Signup failed: " + error.message);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout failed: " + error.message);
      return;
    }
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
