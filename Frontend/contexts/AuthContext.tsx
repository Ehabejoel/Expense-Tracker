import { createContext, useContext, useState, useEffect } from 'react';
import { authStore } from '@/utils/authStore';
import { User } from '@/types/auth';
import { getUserProfile } from '@/utils/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const token = await authStore.getToken();
      setIsAuthenticated(!!token);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const userData = await getUserProfile();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signIn = async (token: string) => {
    await authStore.setToken(token);
    setIsAuthenticated(true);
    await fetchUserProfile();
  };

  const signOut = async () => {
    await authStore.removeToken();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
