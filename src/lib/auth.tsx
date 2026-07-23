import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { auth as gatewayAuth, GatewaySessionUser } from "./data/client";

export type Role = "admin" | "manager" | "rep";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: Role | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

function toAuthUser(sessionUser: GatewaySessionUser): AuthUser {
  return { id: sessionUser.id, email: sessionUser.email, name: sessionUser.name };
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  loading: true,
  signIn: async () => ({ error: "not initialized" }),
  signUp: async () => ({ error: "not initialized" }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const { user: sessionUser } = await gatewayAuth.me();
      if (sessionUser) {
        setUser(toAuthUser(sessionUser));
        setRole(sessionUser.role ?? null);
      } else {
        setUser(null);
        setRole(null);
      }
    } catch {
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        await gatewayAuth.signIn(email, password);
        await refreshSession();
        return {};
      } catch (error) {
        return { error: error instanceof Error ? error.message : "Não foi possível entrar." };
      }
    },
    [refreshSession]
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        await gatewayAuth.signUp(email, password, name);
        await refreshSession();
        return {};
      } catch (error) {
        return { error: error instanceof Error ? error.message : "Não foi possível criar a conta." };
      }
    },
    [refreshSession]
  );

  const signOut = useCallback(async () => {
    await gatewayAuth.signOut();
    setUser(null);
    setRole(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
