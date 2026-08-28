import { useState, useEffect, useCallback } from 'react';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

export function useAuth() {
  const [user, setUser] = useState<UserSession | null>(() => {
    const cached = localStorage.getItem('glasshub_user');
    return cached ? JSON.parse(cached) : null;
  });

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('glasshub_token');
  });

  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  const loginUser = (newUser: UserSession, token: string) => {
    setUser(newUser);
    setAccessToken(token);
    setSessionExpiredMessage(null);
    localStorage.setItem('glasshub_user', JSON.stringify(newUser));
    localStorage.setItem('glasshub_token', token);
  };

  const handleSessionExpired = useCallback((message = 'Sua sessão expirou. Redirecionando para o login...') => {
    setSessionExpiredMessage(message);
    
    setTimeout(() => {
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      setAccessToken(null);
      setSessionExpiredMessage(null);
      window.location.href = '/';
    }, 2000);
  }, []);

  const logoutUser = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        },
        credentials: 'include'
      });
    } catch (e) {}
    
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setAccessToken(null);

    window.location.href = '/';
  };

  const verifySession = useCallback(async () => {
    const token = localStorage.getItem('glasshub_token');
    if (!token && !localStorage.getItem('glasshub_user')) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include'
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem('glasshub_user', JSON.stringify(data.user));
        }
      } else if (res.status === 401) {
        try {
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include'
          });
          const refreshContentType = refreshRes.headers.get('content-type') || '';
          if (refreshRes.ok && refreshContentType.includes('application/json')) {
            const refreshData = await refreshRes.json();
            if (refreshData?.user && refreshData?.accessToken) {
              setUser(refreshData.user);
              setAccessToken(refreshData.accessToken);
              localStorage.setItem('glasshub_user', JSON.stringify(refreshData.user));
              localStorage.setItem('glasshub_token', refreshData.accessToken);
              return;
            }
          }
        } catch (e) {}
        
        handleSessionExpired('Sua sessão expirou. Por favor, faça login novamente.');
      }
    } catch (e) {
      // Network error during verify, keep cached session temporarily
    }
  }, [handleSessionExpired]);

  // Check on mount & listen for global 401 unauthorized events
  useEffect(() => {
    verifySession();

    const handleUnauthorizedEvent = () => {
      handleSessionExpired('Sua sessão expirou. Redirecionando para o login...');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorizedEvent);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorizedEvent);
    };
  }, [verifySession, handleSessionExpired]);

  // Periodic token polling (every 5 minutes)
  useEffect(() => {
    if (!user) return;

    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const intervalId = setInterval(() => {
      verifySession();
    }, FIVE_MINUTES_MS);

    return () => clearInterval(intervalId);
  }, [user, verifySession]);

  return {
    user,
    isAdmin,
    accessToken,
    sessionExpiredMessage,
    loginUser,
    logoutUser,
    verifySession
  };
}
