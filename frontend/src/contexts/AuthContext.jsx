import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);
useEffect(() => {
  console.log('🔄 AuthContext updated - user:', user);
  console.log('🔄 AuthContext updated - isAuthenticated:', isAuthenticated);
}, [user, isAuthenticated]);
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        // Vérifier si le token est encore valide
        const response = await authAPI.getCurrentUser();
        setUser(response.data);
        setIsAuthenticated(true);
        
        // Récupérer les tokens du localStorage
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        setTokens({
          access: accessToken,
          refresh: refreshToken
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      setTokens(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour mettre à jour les tokens (manquante)
  const updateTokens = (newTokens) => {
    setTokens(newTokens);
    localStorage.setItem('access_token', newTokens.access);
    localStorage.setItem('refresh_token', newTokens.refresh);
  };

  // Fonction pour mettre à jour l'utilisateur (manquante)
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      
      const { user: userData, tokens: authTokens } = response.data;
      
      // Stocker les tokens et utilisateur
      updateTokens(authTokens);
      updateUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Erreur de connexion';
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      setTokens(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    tokens,
    isAuthenticated,
    loading,
    login,
    logout,
    setUser: updateUser,        // Ajouté
    setTokens: updateTokens,    // Ajouté
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;