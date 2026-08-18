import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';

import { authAPI, systemAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);


const ADMIN_ROLES = ['admin', 'owner', 'hidden', 'manager', 'co-owner', 'editor'];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);

  const hasPermission = useCallback(
  (permId) => {
    if (!user) return false;
   
    if (user.role === 'owner' || user.role === 'hidden') return true;
    
    return user.permissions?.includes(permId);
  },
  [user]
);
  useEffect(() => {
    let alive = true;

    systemAPI.health()
      .then(() => {
        if (alive) setBackendOnline(true);
      })
      .catch((err) => {
  if (err.code === "ECONNABORTED") {
    toast.error("Server is slow (timeout)");
  } else if (err.response?.status === 401) {
    toast.error("Unauthorized");
  } else if (!err.response) {
    toast.error("Network/CORS issue");
  }
});

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('dv_token');
      const cachedUser = localStorage.getItem('dv_user');

      if (!token) {
        setLoading(false);
        return;
      }

      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch (_) {}
      }

      try {
        const res = await Promise.race([
          authAPI.getMe(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 5000)
          )
        ]);
        const fetchedUser = res.data.user;
        setUser(fetchedUser);
        localStorage.setItem('dv_user', JSON.stringify(fetchedUser));

       
        const isAdmin = ADMIN_ROLES.includes(fetchedUser.role);
        const currentPath = window.location.pathname;
        const isAuthPage = ['/login', '/register'].includes(currentPath);
        if (isAdmin && isAuthPage) {
          window.location.replace('/admin');
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('dv_token');
          localStorage.removeItem('dv_user');
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    localStorage.setItem('dv_token', token);
    localStorage.setItem('dv_user', JSON.stringify(user));
    setUser(user);

  
    if (ADMIN_ROLES.includes(user.role)) {
      window.location.replace('/admin');
    }

    return user;
  }, []);

  const register = useCallback(async (name, email, password, phone) => {
    const res = await authAPI.register({ name, email, password, phone });
    const { token, user } = res.data;
    localStorage.setItem('dv_token', token);
    localStorage.setItem('dv_user', JSON.stringify(user));
    setUser(user);

   
    if (ADMIN_ROLES.includes(user.role)) {
      window.location.replace('/admin');
    }

    return user;
  }, []);

  const setAuthToken = useCallback((token, userData) => {
    localStorage.setItem('dv_token', token);
    localStorage.setItem('dv_user', JSON.stringify(userData));
    setUser(userData);

   
    if (ADMIN_ROLES.includes(userData.role)) {
      window.location.replace('/admin');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('dv_token');
    localStorage.removeItem('dv_user');
    setUser(null);
    toast.success('تم تسجيل الخروج');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('dv_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const roleLevel = {
    user: 0,
    editor: 1,
    admin: 2,
    manager: 3,
    'co-owner': 4,
    owner: 5,
    hidden: 6
  };

  const hasRole = useCallback(
    (required) => {
      if (!user) return false;
      return (roleLevel[user.role] ?? -1) >= (roleLevel[required] ?? 99);
    },
    [user]
  );

  useEffect(() => {
    const handler = () => {
      setUser(null);
      localStorage.removeItem('dv_token');
      localStorage.removeItem('dv_user');
    };

    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        backendOnline,
        login,
        register,
        logout,
        hasPermission,
        updateUser,
        hasRole,
        setAuthToken,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
