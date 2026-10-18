import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { useMe } from '../hooks/useMe';
import { queryClient } from '../queryClient';
import { queryKeys } from '../queryKeys';
import { normalizeDriversResponse } from '../hooks/useDrivers';

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
    queryClient.setQueryData(queryKeys.me, data.user);

    // Warm up critical caches in the background after login.
    // We use the same queryFn and normalisation as the hooks themselves
    // so the cached shape is always identical — preventing the "0 drivers"
    // bug caused by shape mismatches between the prefetch and the hook query.
    setTimeout(() => {
      // Drivers cache — normalise exactly as useDrivers does
      queryClient.prefetchQuery({
        queryKey: queryKeys.drivers,
        queryFn: () =>
          import('../services/api').then((m) =>
            m.driverService.getAll().then((res) => normalizeDriversResponse(res.data))
          ),
        staleTime: 60000,
      }).catch(() => {});

      // Vehicles cache
      queryClient.prefetchQuery({
        queryKey: queryKeys.vehicles,
        queryFn: () =>
          import('../services/api').then((m) =>
            m.vehicleService.getAll().then((res) => {
              const d = res.data;
              if (d && Array.isArray(d.results)) return d.results;
              if (Array.isArray(d)) return d;
              return [];
            })
          ),
        staleTime: 60000,
      }).catch(() => {});
    }, 150);

    return data;
  };

  const logout = () => {
    authService.logout();
    try {
      localStorage.removeItem('tourbee-cache');
    } catch (e) {}
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
