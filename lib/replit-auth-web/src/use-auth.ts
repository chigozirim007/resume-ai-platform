import { useState, useEffect, useCallback } from "react";
import type { AuthUser } from "@workspace/api-client-react";
import { createClient } from "@supabase/supabase-js";
import { setAuthTokenGetter } from "@workspace/api-client-react";

export type { AuthUser };

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Set the global auth token getter so API requests include the Supabase JWT
setAuthTokenGetter(async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
});

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

function supabaseUserToAuthUser(sessionUser: any): AuthUser {
  const metadata = sessionUser?.user_metadata ?? {};
  const fullName = typeof metadata.full_name === "string" ? metadata.full_name : "";
  const [fallbackFirstName, ...fallbackLastNameParts] = fullName.split(" ").filter(Boolean);

  return {
    id: sessionUser.id,
    email: sessionUser.email ?? null,
    firstName: metadata.first_name ?? fallbackFirstName ?? null,
    lastName: metadata.last_name ?? (fallbackLastNameParts.join(" ") || null),
    profileImageUrl: metadata.avatar_url ?? null,
  };
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync Supabase state with API User state
  const syncUser = useCallback(async (sessionUser: any) => {
    if (!sessionUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Get detailed user info from our backend
      const res = await fetch("/api/auth/user", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      setUser(data.user ?? supabaseUserToAuthUser(sessionUser));
    } catch {
      setUser(supabaseUserToAuthUser(sessionUser));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUser(session?.user || null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncUser]);

  const login = useCallback(() => {
    window.location.href = "/login";
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
