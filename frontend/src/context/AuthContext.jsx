import React, { createContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Verify/Sync session with API in background
          const freshUser = await authService.getCurrentUser();
          const mergedUser = { ...freshUser, token: storedToken };
          setUser(mergedUser);
          localStorage.setItem('user', JSON.stringify(mergedUser));
        } catch (error) {
          console.error('Session verification failed, logging out', error);
          authService.logout();
          setUser(null);
          toast.error('Session expired, please login again.');
        }
      }
      setLoading(false);
    };

    initializeUser();
  }, []);

  const login = async (companyCode, email, password) => {
    setLoading(true);
    const loadToast = toast.loading('Authenticating credentials...');
    try {
      const data = await authService.login(companyCode, email, password);
      setUser(data);
      toast.success(`Welcome back to workspace, ${data.name}!`, { id: loadToast });
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(errorMsg, { id: loadToast });
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const registerWorkspace = async (companyName, companyEmail, adminName, adminEmail, adminPassword) => {
    setLoading(true);
    const loadToast = toast.loading('Registering company workspace...');
    try {
      const data = await authService.registerWorkspace(
        companyName,
        companyEmail,
        adminName,
        adminEmail,
        adminPassword
      );
      setUser(data);
      toast.success(`Workspace registered! Welcome, ${data.name}!`, { id: loadToast });
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed. Try again.';
      toast.error(errorMsg, { id: loadToast });
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (name, password) => {
    const loadToast = toast.loading('Updating profile settings...');
    try {
      const data = await authService.updateProfile({ name, password });
      setUser(data);
      toast.success('Profile settings updated successfully!', { id: loadToast });
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Update failed. Try again.';
      toast.error(errorMsg, { id: loadToast });
      return { success: false, error: errorMsg };
    }
  };

  const acceptInvite = async (token, password) => {
    setLoading(true);
    const loadToast = toast.loading('Accepting invitation and saving credentials...');
    try {
      const data = await authService.acceptInvite(token, password);
      setUser(data);
      toast.success(`Welcome to workspace, ${data.name}!`, { id: loadToast });
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to accept invitation.';
      toast.error(errorMsg, { id: loadToast });
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    toast.success('Logged out successfully.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerWorkspace,
        updateProfile,
        acceptInvite,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
