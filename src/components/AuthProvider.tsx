'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/lib/auth';

interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
