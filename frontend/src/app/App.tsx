import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/pages/LandingPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { SupportPage } from './components/pages/SupportPage';
import { AdminCockpitView } from './components/organisms/AdminCockpitView';
import { Toast } from './components/Toast';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const { user, isAdmin, loginUser, sessionExpiredMessage } = useAuth();
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

  return (
    <>
      {sessionExpiredMessage && (
        <div className="fixed bottom-24 right-6 z-50 max-w-sm pointer-events-none">
          <Toast message={sessionExpiredMessage} type="error" duration={4000} />
        </div>
      )}
      {currentView === 'support' ? (
        <SupportPage
          onNavigateHome={() => navigateTo('main')}
          onNavigateDashboard={() => navigateTo('main')}
        />
      ) : (currentView === 'adminCockpit' || ((isAdmin || user?.role === 'ADMIN') && currentView === 'main')) ? (
        <AdminCockpitView
          onBackToWorkspace={() => navigateTo('main')}
        />
      ) : !user ? (
        <LandingPage
          onLoginSuccess={(loggedUser, token) => {
            loginUser(loggedUser, token);
            navigateTo('main');
          }}
          onNavigateSupport={() => navigateTo('support')}
        />
      ) : (
        <DashboardPage
          onOpenAdminCockpit={() => navigateTo('adminCockpit')}
          onOpenSupport={() => navigateTo('support')}
        />
      )}
    </>
  );
}