import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/pages/LandingPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { SupportPage } from './components/pages/SupportPage';
import { AdminCockpitView } from './components/organisms/AdminCockpitView';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const { user, isAdmin, loginUser } = useAuth();
  const [currentView, setCurrentView] = useState<'main' | 'support' | 'adminCockpit'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/support' || window.location.hash === '#support') {
        return 'support';
      }
    }
    return 'main';
  });

  // Sync browser URL / history if desired
  const navigateTo = (view: 'main' | 'support' | 'adminCockpit') => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      if (view === 'support') {
        window.history.pushState(null, '', '#support');
      } else {
        window.history.pushState(null, '', window.location.pathname);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.hash === '#support' || window.location.pathname === '/support') {
        setCurrentView('support');
      } else {
        setCurrentView('main');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 1. Dedicated Support & Help Page
  if (currentView === 'support') {
    return (
      <SupportPage
        onNavigateHome={() => navigateTo('main')}
        onNavigateDashboard={() => navigateTo('main')}
      />
    );
  }

  // 2. Admin Direct Command Center (Override or explicit navigation)
  if (currentView === 'adminCockpit' || ((isAdmin || user?.role === 'ADMIN') && currentView === 'main')) {
    return (
      <AdminCockpitView
        onBackToWorkspace={() => navigateTo('main')}
      />
    );
  }

  // 3. Root Gateway: If not authenticated, render the public Landing Page
  if (!user) {
    return (
      <LandingPage
        onLoginSuccess={(loggedUser, token) => {
          loginUser(loggedUser, token);
          navigateTo('main');
        }}
        onNavigateSupport={() => navigateTo('support')}
      />
    );
  }

  // 4. Candidate Central Management Dashboard & Workspace for Regular Users
  return (
    <DashboardPage
      onOpenAdminCockpit={() => navigateTo('adminCockpit')}
      onOpenSupport={() => navigateTo('support')}
    />
  );
}