import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  clearSession,
  loadSession,
  saveSession,
  type Session,
} from "@/lib/api";
import type { User } from "@/lib/schemas";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // 還原 session
  useEffect(() => {
    setSession(loadSession());
    setIsHydrated(true);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await api.post<Session>("/api/auth/login", {
      username,
      password,
    });
    saveSession(result);
    setSession(result);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    // 後端登出僅為禮貌通知，不阻塞 UI
    api.post("/api/auth/logout").catch(() => undefined);
    clearSession();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session),
      isHydrated,
      login,
      logout,
    }),
    [session, isHydrated, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必須包在 <AuthProvider> 內");
  return ctx;
}
