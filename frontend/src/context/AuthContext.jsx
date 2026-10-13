import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Synchronize or verify token state if present
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await authService.getCurrentUser();
          const profileData = res?.data || res;
          if (profileData && (profileData.email || profileData.id)) {
            setUser(profileData);
            localStorage.setItem('user', JSON.stringify(profileData));
          } else {
            logout();
          }
        } catch (err) {
          console.error('Session expired or invalid:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    // Proactively clear any stale credentials before authenticating
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    const res = await authService.login(email, password);
    const authData = res?.data || res;
    if (authData && authData.token) {
      const { token: jwtToken, id, name, email: userEmail, role } = authData;
      const userData = { id, name, email: userEmail, role };

      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(jwtToken);
      setUser(userData);
      return userData;
    }
    throw new Error('Authentication response invalid');
  };

  const register = async (name, email, password) => {
    return await authService.register(name, email, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const role = user?.role || null;
  const isAuthenticated = !!token && !!user;
  const isAdmin = role === 'ADMIN';
  const isStudent = role === 'STUDENT';

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        isAuthenticated,
        isAdmin,
        isStudent,
        loading,
        login,
        register,
        logout,
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
