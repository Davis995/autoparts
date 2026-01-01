'use client';

// Real Supabase-based authentication
import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface LoginCredentials {
  email: string;
  password: string;
}

// React hook for Supabase auth
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabaseClient.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);

      // Persist access token for API routes that expect a Bearer token
      if (typeof window !== 'undefined') {
        if (data.session?.access_token) {
          localStorage.setItem(
            'auth_session',
            JSON.stringify({ token: data.session.access_token })
          );
        } else {
          localStorage.removeItem('auth_session');
        }
      }
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (typeof window !== 'undefined') {
        if (newSession?.access_token) {
          localStorage.setItem(
            'auth_session',
            JSON.stringify({ token: newSession.access_token })
          );
        } else {
          localStorage.removeItem('auth_session');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async ({ email, password }: LoginCredentials): Promise<void> => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Ensure latest access token is stored
    if (typeof window !== 'undefined') {
      if (data.session?.access_token) {
        localStorage.setItem(
          'auth_session',
          JSON.stringify({ token: data.session.access_token })
        );
      }
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });
    if (error) throw error;
  };

  const logout = async (): Promise<void> => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_session');
    }
  };

  // Assume role is stored in user_metadata.role ("admin" | "customer")
  const role = (user?.user_metadata as any)?.role ?? 'customer';
  const isAdmin = role === 'admin';

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    signIn,
    signInWithGoogle,
    logout,
  };
}

