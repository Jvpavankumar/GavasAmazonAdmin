import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '../types/auth';
import { adminLogin, fetchCurrentUser } from '../api/auth';
import { setAuthToken, getAuthToken } from '../api/client';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  signInWithAdmin: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setAuthLoading(false);
      return;
    }

    fetchCurrentUser()
      .then((profile) => setUser(profile))
      .catch(() => {
        setAuthToken(null);
        setUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const signInWithAdmin = useCallback(async (email: string, password: string) => {
    const { token, user: nextUser } = await adminLogin(email, password);
    setAuthToken(token);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user && getAuthToken()),
      authLoading,
      signInWithAdmin,
      signOut,
    }),
    [user, authLoading, signInWithAdmin, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
