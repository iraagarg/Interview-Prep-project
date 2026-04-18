import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { getToken, setToken, setUser, getUser, logout as doLogout } from '../utils/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(() => getUser());
  const [loading, setLoading] = useState(!!getToken());
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());

  // Verify token on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      api
        .get('/auth/me')
        .then((res) => {
          setUserState(res.data.user);
          setUser(res.data.user);
          setIsAuthenticated(true);
        })
        .catch(() => {
          doLogout();
          setUserState(null);
          setIsAuthenticated(false);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    setUserState(res.data.user);
    setIsAuthenticated(true);
    return res.data;
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data);
    setToken(res.data.token);
    setUser(res.data.user);
    setUserState(res.data.user);
    setIsAuthenticated(true);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    doLogout();
    setUserState(null);
    setIsAuthenticated(false);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUserState(updatedUser);
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
