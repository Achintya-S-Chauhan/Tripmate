import React from 'react';
import DemoBanner from '../common/DemoBanner';
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
    <div className="min-h-screen bg-[#0b1120] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* High-visibility alert banner displayed only during active emergency simulations */}
      <DemoBanner />

      <div className="flex-1 flex overflow-hidden">
        {/* Streamlined Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar pb-24 md:pb-8">
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
