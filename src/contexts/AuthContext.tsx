'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabaseClient } from '@/lib/supabase';
import type { Database } from '@/types/database';
type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, metadata?: { firstName?: string; lastName?: string }) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = supabaseClient;

  // Fetch user profile from our database
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const response = await fetch(`/api/profiles/${userId}`);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        console.error('Error fetching profile:', response.statusText);
        return null;
      }

      return response.json();
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      return null;
    }
  };

  // Create or update user profile
  const upsertProfile = async (user: User, metadata?: { firstName?: string; lastName?: string }): Promise<UserProfile | null> => {
    try {
      const profileData = {
        id: user.id,
        email: user.email!,
        firstName: metadata?.firstName || user.user_metadata?.first_name || null,
        lastName: metadata?.lastName || user.user_metadata?.last_name || null,
        emailVerified: user.email_confirmed_at != null,
        role: 'USER',
        phone: null,
        avatarUrl: null,
        isAdmin: false, // Add this field
      };

      // Try to update first, if not found then create
      const updateResponse = await fetch(`/api/profiles/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (updateResponse.ok) {
        return updateResponse.json();
      }

      // If update fails (not found), create new profile
      const createResponse = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!createResponse.ok) {
        console.error('Error creating profile:', createResponse.statusText);
        return null;
      }

      return createResponse.json();
    } catch (error) {
      console.error('Unexpected error upserting profile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          setSession(session);
          
          // Fetch or create user profile
          let profile = await fetchProfile(session.user.id);
          if (!profile) {
            profile = await upsertProfile(session.user);
          }
          setProfile(profile);
        }
      } catch (error) {
        console.error('Unexpected error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (session?.user) {
          setUser(session.user);
          setSession(session);
          
          // Fetch or create user profile
          let profile = await fetchProfile(session.user.id);
          if (!profile) {
            profile = await upsertProfile(session.user);
          }
          setProfile(profile);
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        return { error };
      }

      if (data.user) {
        // Ensure user profile exists after login
        const profile = await upsertProfile(data.user);
        setProfile(profile);
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as AuthError };
    }
  };

  const signUp = async (email: string, password: string, metadata?: { firstName?: string; lastName?: string }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: metadata?.firstName,
            last_name: metadata?.lastName,
          },
        },
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const response = await fetch(`/api/profiles/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        return { error: new Error('Failed to update profile') };
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      return { error: null };
    } catch (error) {
      return { error: error as any };
    }
  };

const value: AuthContextType = {
  user,
  profile,
  session,
  loading,
  signIn,
  signUp,
  signInWithGoogle,
  signOut,
  updateProfile,
};

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper hook to check if user is admin
export function useIsAdmin() {
  const { profile } = useAuth();
  return profile?.role === 'ADMIN';
}

// Helper hook to check if user is authenticated
export function useIsAuthenticated() {
  const { user } = useAuth();
  return !!user;
}
