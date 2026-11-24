import React from 'react';
import DemoBanner from '../common/DemoBanner';
import DangerZoneBanner from '../common/DangerZoneBanner';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import QuickSearchModal from '../common/QuickSearchModal';
import SosModal from '../common/SosModal';
import ToastContainer from '../common/Toast';
import AuthModal from '../auth/AuthModal';
import { useApp } from '../../context/AppContext';

export default function AppLayout({ children }) {
  const { isAuthModalOpen, closeAuthModal, authModalMode } = useApp();

  return (
    <div className="min-h-screen bg-travel-main text-travel-primary flex flex-col font-sans selection:bg-[var(--accent-bg)] selection:text-[var(--accent-primary)] transition-colors duration-200">
      {/* High-visibility alert banner displayed only during active emergency simulations */}
      <DemoBanner />
      {/* Real danger zone breach warning banner with 60s countdown */}
      <DangerZoneBanner />

      <div className="flex-1 flex w-full">
        {/* Streamlined Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-8">
          <TopBar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </main>
        </div>
      </div>

      {/* Floating Bottom Nav & Drawer for Mobile */}
      <MobileNav />

      {/* Global Modals & Notifications */}
      <QuickSearchModal />
      <SosModal />
      <ToastContainer />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialMode={authModalMode}
      />
    </div>
  );
}
