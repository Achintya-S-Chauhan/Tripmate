import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import AppLayout from './components/layout/AppLayout';
import LandingPage from './components/landing/LandingPage';
import AuthModal from './components/auth/AuthModal';

import OverviewPage from './pages/OverviewPage';
import JourneysPage from './pages/JourneysPage';
import TripDetailsPage from './pages/TripDetailsPage';
import TravelInsightsPage from './pages/TravelInsightsPage';
import SafetyCenterPage from './pages/SafetyCenterPage';
import SavedPlacesPage from './pages/SavedPlacesPage';
import SettingsPage from './pages/SettingsPage';

function PageContent() {
  const { activePage } = useApp();

  switch (activePage) {
    case 'overview':
      return <OverviewPage />;
    case 'journeys':
      return <JourneysPage />;
    case 'trip-details':
      return <TripDetailsPage />;
    case 'insights':
      return <TravelInsightsPage />;
    case 'safety':
      return <SafetyCenterPage />;
    case 'saved-places':
      return <SavedPlacesPage />;
    case 'settings':
      return <SettingsPage />;
    default:
      return <OverviewPage />;
  }
}

function MainApp() {
  const {
    activePage,
    setActivePage,
    setIsDemoMode,
    isAuthModalOpen,
    closeAuthModal,
    openAuthModal,
    authModalMode,
  } = useApp();

  if (activePage === 'landing') {
    return (
      <>
        <LandingPage
          onOpenAuth={(mode) => openAuthModal(mode)}
          onEnterDemo={() => {
            setIsDemoMode(true);
            setActivePage('overview');
          }}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={closeAuthModal}
          initialMode={authModalMode}
        />
      </>
    );
  }

  return (
    <AppLayout>
      <PageContent />
    </AppLayout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
