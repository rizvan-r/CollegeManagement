import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { secureStorage } from '../services/secureStorage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { authService } from '../services/authService';
import { setUnauthorizedCallback } from '../services/api';
import { mapBackendRoleToInternal } from '../constants/roles';
import notificationService from '../services/notificationService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Restore stored session and verify token against backend on startup
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const storedToken = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const cachedUser = await secureStorage.getParsedItem(STORAGE_KEYS.USER_DATA);

        if (!storedToken) {
          if (isMounted) {
            setUser(null);
            setToken(null);
            setIsLoading(false);
          }
          return;
        }

        // Set initial optimistic cached user while verifying with server
        if (isMounted && cachedUser) {
          setToken(storedToken);
          setUser(cachedUser);
        }

        // Verify token against /api/v1/auth/me
        try {
          const freshUser = await authService.getProfile();
          if (isMounted) {
            setUser(freshUser);
            setToken(storedToken);
            setIsOffline(false);
          }
        } catch (verifyErr) {
          // Check if token was rejected as invalid/expired (HTTP 401)
          if (verifyErr?.status === 401) {
            if (isMounted) {
              await authService.logout();
              setUser(null);
              setToken(null);
            }
          } else {
            // Network failure or server temporarily unreachable - preserve cached session
            if (isMounted) {
              setIsOffline(true);
              if (cachedUser) {
                setUser(cachedUser);
                setToken(storedToken);
              }
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    // Register 401 interceptor callback to clear session without redirect loops
    setUnauthorizedCallback(() => {
      if (isMounted) {
        setUser(null);
        setToken(null);
      }
    });

    return () => {
      isMounted = false;
      setUnauthorizedCallback(null);
    };
  }, []);

  // Login handler
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      setUser(result.user);
      setToken(result.token);
      setIsOffline(false);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await notificationService.unregisterDeviceTokenAsync().catch(() => {});
      await authService.logout();
    } finally {
      setToken(null);
      setUser(null);
    }
  }, []);

  // Refresh profile handler
  const refreshProfile = useCallback(async () => {
    try {
      const freshUser = await authService.getProfile();
      setUser(freshUser);
      setIsOffline(false);
      return freshUser;
    } catch (err) {
      if (err?.status !== 401) {
        setIsOffline(true);
      }
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      role: user?.role || null,
      internalRole: user ? mapBackendRoleToInternal(user.role) : null,
      isLoading,
      isOffline,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      refreshProfile,
    }),
    [user, token, isLoading, isOffline, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
