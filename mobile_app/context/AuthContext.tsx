import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '@/services/api';

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'agent' | 'salesperson';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: { token: string; user: User }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('user_token');
      const savedUser = await SecureStore.getItemAsync('user_data');
      
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
        // Verify token with backend
        try {
          const verified = await authService.verify();
          if (verified.valid) {
            setUser(verified.user);
            await SecureStore.setItemAsync('user_data', JSON.stringify(verified.user));
          } else {
            throw new Error('Invalid token');
          }
        } catch (err) {
          console.warn('Token verification failed, logging out');
          await logout();
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ token, user }: { token: string; user: User }) => {
    await SecureStore.setItemAsync('user_token', token);
    await SecureStore.setItemAsync('user_data', JSON.stringify(user));
    setUser(user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
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
