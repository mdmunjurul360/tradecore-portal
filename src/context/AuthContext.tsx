import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { authService, INITIAL_USER } from '../services/mock/authService';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email?: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  switchUserRole: (role: 'verified' | 'unverified' | 'pending') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Logged in by default for personal area

  useEffect(() => {
    const initAuth = async () => {
      try {
        const u = await authService.getCurrentUser();
        setUser(u);
        setIsAuthenticated(true);
      } catch (err) {
        console.error(err);
        setUser(INITIAL_USER);
        setIsAuthenticated(true);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (_email?: string, _password?: string): Promise<boolean> => {
    setIsLoading(true);
    const u = await authService.getCurrentUser();
    setUser(u);
    setIsAuthenticated(true);
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    const updated = await authService.updateUserProfile(updates);
    setUser(updated);
  };

  const switchUserRole = (role: 'verified' | 'unverified' | 'pending') => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      kycStatus: role === 'verified' ? 'verified' : role === 'pending' ? 'pending' : 'unverified',
      identityVerified: role === 'verified',
      addressVerified: role === 'verified',
    };
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, updateUser, switchUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
