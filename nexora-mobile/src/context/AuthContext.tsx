import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import authApi, { AuthResponse, LoginRequest, RegisterRequest } from '../api/auth.api';
import apiClient from '../api/client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId?: string;
  businessType?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  businessType: string | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const USER_STORAGE_KEY = 'user_data';

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [businessType, setBusinessType] = useState<string | null>(null);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const token = await apiClient.getToken();
      if (token) {
        const userJson = await SecureStore.getItemAsync(USER_STORAGE_KEY);
        if (userJson) {
          const storedUser = JSON.parse(userJson);
          setUser(storedUser);
          // Restaurar businessType desde el usuario almacenado
          if (storedUser.businessType) {
            setBusinessType(storedUser.businessType);
          }
        }
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (userData: User) => {
    try {
      await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      // Extract businessType from user data
      if (userData.businessType) {
        setBusinessType(userData.businessType);
      } else if (userData.tenantId) {
        // Try to get from tenant config if available
        setBusinessType(null);
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const login = async (data: LoginRequest) => {
    const response: AuthResponse = await authApi.login(data);
    await saveUser(response.user);
  };

  const register = async (data: RegisterRequest) => {
    const response: AuthResponse = await authApi.register(data);
    await saveUser(response.user);
  };

  const logout = async () => {
    await authApi.logout();
    await SecureStore.deleteItemAsync(USER_STORAGE_KEY);
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      saveUser(updatedUser);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    businessType,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
