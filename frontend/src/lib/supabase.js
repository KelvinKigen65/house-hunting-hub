import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isDemoMode =
  !supabaseUrl ||
  !supabaseAnonKey ||
  /placeholder|your-project-id|your-anon-key/i.test(`${supabaseUrl} ${supabaseAnonKey}`);

function createMockQuery(single = false) {
  const state = { single };

  const response = () => ({
    data: state.single ? null : [],
    error: null,
    count: 0,
  });

  const query = new Proxy({}, {
    get(_target, prop) {
      if (prop === "then") return (resolve, reject) => Promise.resolve(response()).then(resolve, reject);
      if (prop === "catch") return (reject) => Promise.resolve(response()).catch(reject);
      if (prop === "finally") return (handler) => Promise.resolve(response()).finally(handler);
      if (prop === "single" || prop === "maybeSingle") return () => {
        state.single = true;
        return query;
      };
      return () => query;
    },
  });

  return query;
}

function createMockSupabaseClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signUp: async () => ({ data: { user: null, session: null }, error: new Error("Supabase is not configured") }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error("Supabase is not configured") }),
      signOut: async () => ({ error: null }),
    },
    from: () => createMockQuery(),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: new Error("Supabase is not configured") }),
        getPublicUrl: () => ({ data: { publicUrl: null } }),
      }),
    },
  };
}

export const supabase = isDemoMode
  ? createMockSupabaseClient()
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });

// Helper: get public URL for stored images
export function getStorageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (isDemoMode) return null;
  const { data } = supabase.storage.from("house-images").getPublicUrl(path);
  return data?.publicUrl || null;
}