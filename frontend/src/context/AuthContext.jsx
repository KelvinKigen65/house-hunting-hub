import { useEffect, useState } from "react";
import { djangoApi } from "../lib/djangoApi";
import { AuthContext } from "./AuthContextObject";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId, userMetadata = {}) {
    try {
      const profileData = await djangoApi.profiles.get(userId);
      setProfile(profileData);
    } catch {
      setProfile({
        id: userId,
        role: userMetadata.role,
        full_name: userMetadata.full_name || "",
      });
    }
  }

  useEffect(() => {
    let unsubscribed = false;
    let unsubscribe = () => {};

    async function bootstrapAuth() {
      try {
        const session = await djangoApi.auth.getSession();
        if (unsubscribed) return;

        setUser(session?.user ?? null);
        if (session?.user) await fetchProfile(session.user.id, session.user.user_metadata);
      } catch (err) {
        console.warn("Django session error:", err.message);
      }

      try {
        const subscription = djangoApi.auth.onAuthStateChange(
          async (_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
              await fetchProfile(session.user.id, session.user.user_metadata);
            } else {
              setProfile(null);
            }
          }
        );
        unsubscribe = () => subscription?.unsubscribe();
      } catch (err) {
        console.warn("Auth state change listener error:", err.message);
      } finally {
        if (!unsubscribed) setLoading(false);
      }
    }

    void bootstrapAuth();

    return () => {
      unsubscribed = true;
      unsubscribe();
    };
  }, []);

  async function signUp({ email, password, fullName, role }) {
    try {
      const user = await djangoApi.auth.register({ email, password, fullName, role });
      return { data: { user }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async function signIn({ email, password }) {
    try {
      const user = await djangoApi.auth.login({ email, password });
      return { data: { user }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async function signOut() {
    // Force local sign-out first so UI updates immediately even if network fails
    try {
      setUser(null);
      setProfile(null);
      // Clear stale Supabase localStorage from earlier builds.
      try {
        Object.keys(localStorage)
          .filter((k) => typeof k === "string" && k.startsWith("sb-"))
          .forEach((k) => localStorage.removeItem(k));
      } catch {
        // ignore localStorage errors (e.g., SSR or restricted storage)
      }

      // Attempt server-side sign-out; don't block UI on failure
      try {
        await djangoApi.auth.logout();
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
