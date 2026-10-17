import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { useMe } from '../hooks/useMe';
import { queryClient } from '../queryClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser());

  // If we already have a user from localStorage, skip the loading gate immediately.
  // The useMe query will silently refresh the profile in the background.
  const [loading, setLoading] = useState(() => !authService.getCurrentUser());

  const { data: profileData, isLoading: profileLoading } = useMe();

  useEffect(() => {
    if (profileData) {
      setUser(profileData);
    }
    // Clear loading once the profile fetch settles (success, error, or disabled)
    if (!profileLoading) {
      setLoading(false);
    }
  }, [profileData, profileLoading]);

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    setUser(data.user);
    queryClient.setQueryData(['me'], data.user);
    return data;
  };

  const logout = () => {
    authService.logout();
    queryClient.clear();
    setUser(null);
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN' || user?.is_admin,
    isDriver: user?.role === 'DRIVER',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
