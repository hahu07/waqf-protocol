'use client';

import { createContext, useContext, ReactNode, useState, useCallback, useEffect, useMemo } from 'react';
import { onAuthStateChange, type User, signIn, signOut, type SignInOptions } from '@junobuild/core';
import { useJuno } from './JunoContext';
type AuthUser = {
  key: string;
  role?: 'admin' | 'user';
  createdAt: number;
};

export type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  toggleAuthMode: () => void;
  isSignUpMode: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const { initialize } = useJuno();

  const checkIsAdmin = useCallback((user: AuthUser | null): boolean => {
    return user?.role === 'admin';
  }, []);

  const handleAuthStateChange = useCallback((user: User | null) => {
    if (user) {
      // Get the actual role from the user
      const actualRole = user.owner ? 'admin' : 'user';
      
      // In development mode, check for role override
      let effectiveRole = actualRole;
      if (process.env.NODE_ENV === 'development') {
        const devModeRole = typeof window !== 'undefined' 
          ? localStorage.getItem('devModeRole') as 'admin' | 'user' | null
          : null;
        if (devModeRole) {
          effectiveRole = devModeRole;
        }
      }
      
      setUser({
        key: user.key,
        role: effectiveRole,
        createdAt: Number(user.created_at)
      });
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const toggleAuthMode = useCallback(() => {
    setIsSignUpMode(prev => !prev);
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        await initialize();
        unsubscribe = onAuthStateChange((user) => handleAuthStateChange(user));
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Auth initialization failed'));
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      unsubscribe?.();
    };
  }, [initialize, handleAuthStateChange]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: !!user,
    isAdmin: checkIsAdmin(user),
    isLoading,
    error,
    isSignUpMode,
    toggleAuthMode,
    signIn: async () => {
      try {
        setIsLoading(true);
        setError(null);
        await initialize();
        
        // Only Internet Identity authentication
        await signIn({ 
          internet_identity: {
            options: {
              domain: "id.ai"
            }
          } 
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Sign-in with Internet Identity failed'));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    signOut: async () => {
      try {
        setIsLoading(true);
        await signOut();
        setUser(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Sign-out failed'));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
  }), [user, isLoading, error, initialize, checkIsAdmin, isSignUpMode, toggleAuthMode]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
