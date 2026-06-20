import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { db } from '../services/db';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasUsers, setHasUsers] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const users = db.getAll('users');
        setHasUsers(users.length > 0);
        
        if (authService.isAuthenticated()) {
          setUser(authService.getCurrentUser());
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Error checking authentication state:', e);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    
    // Custom event listener to sync auth state if needed
    window.addEventListener('auth-change', checkAuth);
    return () => {
      window.removeEventListener('auth-change', checkAuth);
    };
  }, []);

  const login = (username, password) => {
    const loggedInUser = authService.login(username, password);
    setUser(loggedInUser);
    
    // Check users count again
    const users = db.getAll('users');
    setHasUsers(users.length > 0);
    
    return loggedInUser;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const register = (userData) => {
    const newUser = authService.register(userData);
    
    // Check users count again
    const users = db.getAll('users');
    setHasUsers(users.length > 0);
    
    return newUser;
  };

  const updateProfile = (updates) => {
    if (!user) return;
    const updated = authService.updateProfile(user.id, updates);
    setUser(updated);
    return updated;
  };

  const changePassword = (oldPassword, newPassword) => {
    if (!user) return false;
    return authService.changePassword(user.id, oldPassword, newPassword);
  };

  const deleteAccount = () => {
    if (!user) return false;
    const result = authService.deleteAccount(user.id);
    if (result) {
      setUser(null);
      // Check users count again
      const users = db.getAll('users');
      setHasUsers(users.length > 0);
    }
    return result;
  };

  const refreshUser = () => {
    if (user) {
      setUser(authService.getCurrentUser());
    }
  };

  const value = {
    user,
    loading,
    hasUsers,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    deleteAccount,
    refreshUser,
    setHasUsers
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
