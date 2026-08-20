import { useState, useEffect } from 'react';

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

  const isAdmin = user?.role === 'ADMIN';

  const loginUser = (newUser: UserSession, token: string) => {
    setUser(newUser);
    setAccessToken(token);
    localStorage.setItem('glasshub_user', JSON.stringify(newUser));
    localStorage.setItem('glasshub_token', token);
  };

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

    // Hard reload browser directly to public landing page
    window.location.href = '/';
  };

  // Check /me on mount to refresh session or silently renew via refresh_token cookie
  useEffect(() => {
    const token = localStorage.getItem('glasshub_token');
    fetch('/api/auth/me', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      credentials: 'include'
    })
      .then(async res => {
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
              }
            }
          } catch (e) {}
        }
      })
      .catch(() => {});
  }, []);

  return {
    user,
    isAdmin,
    accessToken,
    loginUser,
    logoutUser
  };
}
