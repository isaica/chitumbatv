import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '@/types';
import { mockUsers } from '@/data/mock';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; requiresTwoFactor?: boolean }>;
  verifyTwoFactor: (code: string) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  isLoading: boolean;
  loginAttempts: number;
  isLocked: boolean;
  sessionTimeout: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30 * 60 * 1000); // 30 minutes
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  // Session management
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (savedUser && rememberMe) {
      setUser(JSON.parse(savedUser));
    }

    // Check for lockout
    const lockoutEnd = localStorage.getItem('lockoutEnd');
    if (lockoutEnd && Date.now() < parseInt(lockoutEnd)) {
      setIsLocked(true);
      const remainingTime = parseInt(lockoutEnd) - Date.now();
      setTimeout(() => {
        setIsLocked(false);
        setLoginAttempts(0);
        localStorage.removeItem('lockoutEnd');
      }, remainingTime);
    }
  }, []);

  // Auto logout on session timeout
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        logout();
      }, sessionTimeout);
      
      return () => clearTimeout(timer);
    }
  }, [user, sessionTimeout]);

  const login = async (email: string, password: string, rememberMe = false) => {
    if (isLocked) {
      return { success: false };
    }

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock authentication
    const foundUser = mockUsers.find(u => u.email === email);
    
    if (foundUser && password === '123456') {
      // Check if user has 2FA enabled (mock: admin users require 2FA)
      if (foundUser.role === 'admin') {
        setPendingUser(foundUser);
        setIsLoading(false);
        return { success: true, requiresTwoFactor: true };
      }
      
      setUser(foundUser);
      setLoginAttempts(0);
      
      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(foundUser));
        localStorage.setItem('rememberMe', 'true');
      }
      
      setIsLoading(false);
      return { success: true };
    }
    
    // Handle failed login
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      setIsLocked(true);
      const lockoutEnd = Date.now() + LOCKOUT_DURATION;
      localStorage.setItem('lockoutEnd', lockoutEnd.toString());
      
      setTimeout(() => {
        setIsLocked(false);
        setLoginAttempts(0);
        localStorage.removeItem('lockoutEnd');
      }, LOCKOUT_DURATION);
    }
    
    setIsLoading(false);
    return { success: false };
  };

  const verifyTwoFactor = async (code: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock 2FA verification
    if (code === '123456' && pendingUser) {
      setUser(pendingUser);
      setPendingUser(null);
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock password reset - always succeed for demo
    return true;
  };

  const logout = () => {
    setUser(null);
    setPendingUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      verifyTwoFactor,
      logout, 
      resetPassword,
      isLoading,
      loginAttempts,
      isLocked,
      sessionTimeout
    }}>
      {children}
    </AuthContext.Provider>
  );
};