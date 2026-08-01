'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole } from '@/lib/types';
import { authApi } from '@/lib/scn-api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  setSession: (authToken: string, authUser: User, redirect?: boolean | string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const dashboardRoutes: Record<UserRole, string> = {
    worker: '/worker/dashboard',
    recruiter: '/recruiter/dashboard',
    admin: '/admin/dashboard',
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('auth-token');
    const storedUser = localStorage.getItem('auth-user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
      }
    }
    setIsLoading(false);

    const handleForcedLogout = () => {
      setToken(null);
      setUser(null);
      router.push('/login');
    };

    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, [router]);

  const setSession = (authToken: string, authUser: User, redirect: boolean | string = true) => {
    localStorage.setItem('auth-token', authToken);
    localStorage.setItem('auth-user', JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);

    if (redirect) {
      if (typeof redirect === 'string') {
        router.push(redirect);
      } else {
        router.push(dashboardRoutes[authUser.role]);
      }
    }
  };

  const login = async (email: string, password: string) => {
    const { token: authToken, user: authUser } = await authApi.login(email, password);
    setSession(authToken, authUser);
    return authUser;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Token may already be expired; local cleanup is still the source of truth for the UI.
    }
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('auth-user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, setSession, logout, updateUser, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
