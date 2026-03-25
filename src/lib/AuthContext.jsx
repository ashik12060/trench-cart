import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { storeApi } from '@/api/storeClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  const refreshAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const currentUser = await storeApi.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      if (error?.status === 401 || error?.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      } else {
        setAuthError({ type: 'unknown', message: error?.message || 'Failed to load auth state' });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const loginAdmin = async (email, password) => {
    setAuthError(null);
    const loggedUser = await storeApi.auth.login(email, password);
    setUser(loggedUser);
    setIsAuthenticated(true);
    return loggedUser;
  };

  const logout = async () => {
    await storeApi.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = (returnUrl) => {
    storeApi.auth.redirectToLogin(returnUrl || window.location.href);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        loginAdmin,
        logout,
        navigateToLogin,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
