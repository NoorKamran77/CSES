import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function getFullUrl(url) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${path}`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authenticated fetch helper
  const apiFetch = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('cses_token');
    const headers = { ...(options.headers || {}) };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    const res = await fetch(getFullUrl(url), {
      ...options,
      headers,
      credentials: 'include',
    });

    return res;
  }, []);

  // Fetch current user on app start
  const fetchMe = useCallback(async () => {
    try {
      const res = await apiFetch('/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Try refresh token if access token failed
        const storedRefreshToken = localStorage.getItem('cses_refresh_token');
        const refreshRes = await fetch(getFullUrl('/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ refreshToken: storedRefreshToken || undefined }),
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          localStorage.setItem('cses_token', refreshData.accesstoken);
          setUser(refreshData.user);
        } else {
          localStorage.removeItem('cses_token');
          localStorage.removeItem('cses_refresh_token');
          setUser(null);
        }
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    const res = await fetch(getFullUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    localStorage.setItem('cses_token', data.accesstoken);
    if (data.refreshtoken) {
      localStorage.setItem('cses_refresh_token', data.refreshtoken);
    }
    setUser(data.user);
    return data.user;
  };

  const register = async (username, email, password) => {
    const res = await fetch(getFullUrl('/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    // Auto login after registration
    return await login(email, password);
  };

  const logout = async () => {
    try {
      await fetch(getFullUrl('/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('cses_token');
    localStorage.removeItem('cses_refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, apiFetch, refreshUser: fetchMe }}>
      {children}
    </AuthContext.Provider>

  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

