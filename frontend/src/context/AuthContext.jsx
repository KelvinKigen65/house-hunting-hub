import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!error && data) setProfile(data);
  }

  useEffect(() => {
    // Get initial session
    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id);
        setLoading(false);
      }).catch((err) => {
        console.warn("Supabase session error:", err.message);
        setLoading(false);
      });
    } catch (err) {
      console.warn("Supabase not configured:", err.message);
      setLoading(false);
    }

    // Listen for auth changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
          }
        }
      );
      return () => subscription?.unsubscribe();
    } catch (err) {
      console.warn("Auth state change listener error:", err.message);
      return () => {};
    }
  }, []);

  async function signUp({ email, password, fullName, role }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });
    return { data, error };
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async function signOut() {
    // Force local sign-out first so UI updates immediately even if network fails
    try {
      setUser(null);
      setProfile(null);
      // Clear Supabase-related localStorage entries (keys start with 'sb-')
      try {
        Object.keys(localStorage)
          .filter((k) => typeof k === "string" && k.startsWith("sb-"))
          .forEach((k) => localStorage.removeItem(k));
      } catch (e) {
        // ignore localStorage errors (e.g., SSR or restricted storage)
      }

      // Attempt server-side sign-out; don't block UI on failure
      try {
        const res = await supabase.auth.signOut();
        if (res?.error) {
          console.warn("Sign out failed on server:", res.error.message || res.error);
          return { error: res.error };
        }
        return { error: null };
      } catch (err) {
        console.warn("Sign out exception (server):", err.message || err);
        return { error: err };
      }
    } catch (err) {
      console.warn("Sign out exception:", err.message || err);
      return { error: err };
    }
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  const isAdmin = profile?.role === "admin";
  const isLandlord = profile?.role === "landlord" || isAdmin;
  const isTenant = profile?.role === "tenant";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        isLandlord,
        isTenant,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}