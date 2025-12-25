import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'parent';
  segment?: string;
  linkedUsers?: any[];
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, otp: string, userData?: any) => Promise<boolean>;
  logout: () => void;
  sendOTP: (email: string, role: 'student' | 'parent') => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authAPI.getCurrentUser();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('token');
          console.error('Auth initialization failed:', error);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const sendOTP = async (email: string, role: 'student' | 'parent'): Promise<boolean> => {
    try {
      await authAPI.sendOTP(email, role);
      toast.success('OTP sent successfully!');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send OTP');
      return false;
    }
  };

  const login = async (email: string, otp: string, userData?: any): Promise<boolean> => {
    try {
      const response = await authAPI.verifyOTP(email, otp, userData);
      
      localStorage.setItem('token', response.token);
      setUser(response.user);
      
      if (response.isNewUser) {
        toast.success(`Welcome ${response.user.name}! Your account has been created.`);
      } else {
        toast.success(`Welcome back, ${response.user.name}!`);
      }
      
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    sendOTP
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};