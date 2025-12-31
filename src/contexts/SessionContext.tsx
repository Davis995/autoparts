'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
}

interface Session {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

interface SessionContextType {
  session: Session;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({
    user: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setSession({
          user,
          token,
          isLoading: false,
        });
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        setSession({
          user: null,
          token: null,
          isLoading: false,
        });
      }
    } else {
      setSession({
        user: null,
        token: null,
        isLoading: false,
      });
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // API call to login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      // Store session
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      
      setSession({
        user: data.user,
        token: data.token,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      // API call to register
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      // Store session
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      
      setSession({
        user: data.user,
        token: data.token,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    // Clear session
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    
    setSession({
      user: null,
      token: null,
      isLoading: false,
    });

    // Redirect to login
    window.location.href = '/login';
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    if (!session.token) return false;

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        return false;
      }

      const updatedUser = await response.json();
      
      // Update session
      const newUserData = { ...session.user, ...updatedUser };
      localStorage.setItem('user_data', JSON.stringify(newUserData));
      
      setSession(prev => ({
        ...prev,
        user: newUserData,
      }));

      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  return (
    <SessionContext.Provider
      value={{
        session,
        login,
        logout,
        register,
        updateProfile,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
