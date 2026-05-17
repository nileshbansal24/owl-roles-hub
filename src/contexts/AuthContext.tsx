import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let currentUserId: string | null = null;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        const newUserId = newSession?.user?.id ?? null;
        // Skip noisy events that don't change identity (TOKEN_REFRESHED, USER_UPDATED with same id)
        // to avoid triggering downstream refetches on every tab focus / token refresh.
        if (event === "TOKEN_REFRESHED" && newUserId === currentUserId) {
          setSession(newSession);
          return;
        }
        currentUserId = newUserId;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      currentUserId = existing?.user?.id ?? null;
      setSession(existing);
      setUser(existing?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Always clear client state, even if the server-side session is already expired/invalid.
    // This prevents the UI from getting stuck in a "logged in" state.
    setUser(null);
    setSession(null);

    try {
      // "local" guarantees local storage/session is cleared even when /logout returns 403
      // (e.g. session_not_found).
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Intentionally ignore sign-out failures; state is already cleared.
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};